import { Hono } from "hono";

export const healthRoutes = new Hono().get("/", (c) => {
  const mem = process.memoryUsage();
  return c.json({
    status: "ok",
    service: "auth",
    memory: { rss: mem.rss, heapUsed: mem.heapUsed },
  });
});
