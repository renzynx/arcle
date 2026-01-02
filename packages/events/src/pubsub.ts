import { Redis } from "ioredis";
import type { z } from "zod";
import { deserialize, serialize } from "./index.ts";

type EventHandler<T> = (payload: T) => void | Promise<void>;

export class PubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, EventHandler<unknown>[]> = new Map();

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on("message", (channel: string, message: string) => {
      const handlers = this.handlers.get(channel);
      if (!handlers) return;

      const payload = deserialize(message);
      for (const handler of handlers) {
        handler(payload);
      }
    });
  }

  async publish<T>(event: string, payload: T): Promise<void> {
    const message = serialize(payload);
    await this.publisher.publish(event, message);
  }

  subscribe<T extends z.ZodType>(
    event: string,
    schema: T,
    handler: EventHandler<z.infer<T>>,
  ): void {
    const wrappedHandler: EventHandler<unknown> = (payload) => {
      const parsed = schema.parse(payload);
      return handler(parsed);
    };

    const existing = this.handlers.get(event) || [];
    existing.push(wrappedHandler);
    this.handlers.set(event, existing);

    this.subscriber.subscribe(event);
  }

  async close(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

let instance: PubSub | null = null;

export function createPubSub(redisUrl: string): PubSub {
  if (!instance) {
    instance = new PubSub(redisUrl);
  }
  return instance;
}

export function getPubSub(): PubSub {
  if (!instance) {
    throw new Error("PubSub not initialized. Call createPubSub first.");
  }
  return instance;
}

export function tryGetPubSub(): PubSub | null {
  return instance;
}
