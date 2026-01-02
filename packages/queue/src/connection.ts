import type { RedisOptions } from "ioredis";

let connectionOptions: RedisOptions | null = null;

export function initQueueConnection(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);

  connectionOptions = {
    host: url.hostname,
    port: Number.parseInt(url.port, 10) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null,
  };

  return connectionOptions;
}

export function getConnectionOptions(): RedisOptions {
  if (!connectionOptions) {
    throw new Error(
      "Queue connection not initialized. Call initQueueConnection first.",
    );
  }
  return connectionOptions;
}
