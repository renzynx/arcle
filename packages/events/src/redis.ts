import { Redis } from "ioredis";

let redisClient: Redis | null = null;

export function createRedisClient(redisUrl: string): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl);
  }
  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error(
      "Redis client not initialized. Call createRedisClient first.",
    );
  }
  return redisClient;
}

export function tryGetRedisClient(): Redis | null {
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
