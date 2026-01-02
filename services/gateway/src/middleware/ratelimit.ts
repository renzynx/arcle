import {
  type ClientIpHeaders,
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  type RateLimitConfig,
  RateLimitPresets,
} from "@arcle/cache";
import type { Context, MiddlewareHandler } from "hono";

type RoutePattern = {
  pattern: RegExp;
  config: RateLimitConfig;
};

const ROUTE_RATE_LIMITS: RoutePattern[] = [
  { pattern: /^\/api\/media\/upload/, config: RateLimitPresets.upload },
  { pattern: /^\/api\/catalog\/search/, config: RateLimitPresets.search },
  { pattern: /^\/api\/catalog\/admin/, config: RateLimitPresets.strict },
  { pattern: /^\/api\/media\/admin/, config: RateLimitPresets.strict },
  { pattern: /^\/api\/users\/admin/, config: RateLimitPresets.strict },
];

const SKIP_PATHS = new Set(["/health", "/status", "/stats/health"]);

const SKIP_PREFIXES = ["/api/auth/"];

const DEFAULT_CONFIG = RateLimitPresets.standard;

function getConfigForPath(path: string): {
  config: RateLimitConfig;
  endpoint: string;
} {
  for (const route of ROUTE_RATE_LIMITS) {
    if (route.pattern.test(path)) {
      return {
        config: route.config,
        endpoint: path.split("/").slice(0, 4).join("/"),
      };
    }
  }
  return { config: DEFAULT_CONFIG, endpoint: "default" };
}

function extractClientIpHeaders(c: Context): ClientIpHeaders {
  return {
    cfConnectingIp: c.req.header("cf-connecting-ip"),
    trueClientIp: c.req.header("true-client-ip"),
    fastlyClientIp: c.req.header("fastly-client-ip"),
    xClientIp: c.req.header("x-client-ip"),
    xClusterClientIp: c.req.header("x-cluster-client-ip"),
    xRealIp: c.req.header("x-real-ip"),
    xOriginalForwardedFor: c.req.header("x-original-forwarded-for"),
    xForwardedFor: c.req.header("x-forwarded-for"),
  };
}

export const rateLimiter: MiddlewareHandler = async (c: Context, next) => {
  if (SKIP_PATHS.has(c.req.path)) {
    return next();
  }

  // Skip rate limiting for auth routes (better-auth handles its own security)
  for (const prefix of SKIP_PREFIXES) {
    if (c.req.path.startsWith(prefix)) {
      return next();
    }
  }

  const headers = extractClientIpHeaders(c);
  const identifier = getClientIdentifier(headers);
  const { config, endpoint } = getConfigForPath(c.req.path);

  const result = await checkRateLimit(identifier, endpoint, config);
  const rateLimitHeaders = getRateLimitHeaders(result, config);

  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    c.header(key, value);
  }

  if (!result.allowed) {
    return c.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter,
      },
      429,
    );
  }

  return next();
};
