export const config = {
  port: Number(Bun.env.GATEWAY_PORT) || 3000,
  redisUrl: Bun.env.REDIS_URL || "redis://localhost:6379",
  allowedOrigins: Bun.env.TRUSTED_ORIGINS?.split(",") || [
    "http://localhost:8000",
    "http://localhost:9000",
  ],
  adminOrigin: Bun.env.ADMIN_ORIGIN || "http://localhost:9000",
  services: {
    auth: Bun.env.AUTH_URL || "http://localhost:4000",
    users: Bun.env.USERS_URL || "http://localhost:5000",
    catalog: Bun.env.CATALOG_URL || "http://localhost:6000",
    media: Bun.env.MEDIA_URL || "http://localhost:7000",
  },
} as const;

export type ServiceName = keyof typeof config.services;
