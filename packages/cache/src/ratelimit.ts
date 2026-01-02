import { tryGetRedisClient } from "@arcle/events/redis";

const PREFIX = "arcle:ratelimit";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number | null;
}

export const RateLimitPresets = {
  strict: { windowMs: 60_000, maxRequests: 30 },
  standard: { windowMs: 60_000, maxRequests: 100 },
  relaxed: { windowMs: 60_000, maxRequests: 300 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  upload: { windowMs: 60_000, maxRequests: 20 },
  search: { windowMs: 60_000, maxRequests: 60 },
} as const;

function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${PREFIX}:${endpoint}:${identifier}`;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = tryGetRedisClient();

  if (!redis) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: 0,
      retryAfter: null,
    };
  }

  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(
    key,
    now.toString(),
    `${now}-${Math.random().toString(36).slice(2)}`,
  );
  multi.zcard(key);
  multi.pexpire(key, config.windowMs);

  const results = await multi.exec();

  if (!results) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: 0,
      retryAfter: null,
    };
  }

  const count = results[2]?.[1] as number;
  const allowed = count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - count);

  const oldestResult = await redis.zrange(key, 0, 0, "WITHSCORES");
  const oldestTimestamp =
    oldestResult.length >= 2 ? Number(oldestResult[1]) : now;
  const resetAt = oldestTimestamp + config.windowMs;

  return {
    allowed,
    remaining,
    resetAt,
    retryAfter: allowed ? null : Math.ceil((resetAt - now) / 1000),
  };
}

export interface ClientIpHeaders {
  cfConnectingIp?: string | null;
  xForwardedFor?: string | null;
  xRealIp?: string | null;
  trueClientIp?: string | null;
  xClientIp?: string | null;
  xClusterClientIp?: string | null;
  fastlyClientIp?: string | null;
  xOriginalForwardedFor?: string | null;
}

export function getClientIdentifier(headers: ClientIpHeaders): string {
  if (headers.cfConnectingIp) {
    return headers.cfConnectingIp;
  }

  if (headers.trueClientIp) {
    return headers.trueClientIp;
  }

  if (headers.fastlyClientIp) {
    return headers.fastlyClientIp;
  }

  if (headers.xClientIp) {
    return headers.xClientIp;
  }

  if (headers.xClusterClientIp) {
    return headers.xClusterClientIp;
  }

  if (headers.xRealIp) {
    return headers.xRealIp;
  }

  if (headers.xOriginalForwardedFor) {
    const ip = headers.xOriginalForwardedFor.split(",")[0];
    if (ip) return ip.trim();
  }

  if (headers.xForwardedFor) {
    const ip = headers.xForwardedFor.split(",")[0];
    if (ip) return ip.trim();
  }

  return "unknown";
}

export function getRateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig,
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };

  if (result.retryAfter !== null) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}
