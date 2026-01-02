import { tryGetRedisClient } from "@arcle/events/redis";
import superjson from "superjson";

export async function get<T>(key: string): Promise<T | null> {
  const redis = tryGetRedisClient();
  if (!redis) return null;

  const data = await redis.get(key);
  if (!data) return null;

  return superjson.parse<T>(data);
}

export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const redis = tryGetRedisClient();
  if (!redis) return;

  const serialized = superjson.stringify(value);
  await redis.setex(key, ttlSeconds, serialized);
}

export async function del(key: string): Promise<void> {
  const redis = tryGetRedisClient();
  if (!redis) return;

  await redis.del(key);
}

export async function delPattern(pattern: string): Promise<number> {
  const redis = tryGetRedisClient();
  if (!redis) return 0;

  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;

  return redis.del(...keys);
}

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await set(key, fresh, ttlSeconds);
  return fresh;
}
