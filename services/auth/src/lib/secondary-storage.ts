import { getRedisClient } from "@arcle/events/redis";

const KEY_PREFIX = "auth:";

export const secondaryStorage = {
  async get(key: string): Promise<string | null> {
    const redis = getRedisClient();
    return redis.get(`${KEY_PREFIX}${key}`);
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const redis = getRedisClient();
    if (ttl) {
      await redis.set(`${KEY_PREFIX}${key}`, value, "EX", ttl);
    } else {
      await redis.set(`${KEY_PREFIX}${key}`, value);
    }
  },

  async delete(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${KEY_PREFIX}${key}`);
  },
};
