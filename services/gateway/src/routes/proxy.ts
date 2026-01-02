import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { config, type ServiceName } from "../config.ts";

function createProxyHandler(
  service: ServiceName,
  pathPrefix: string,
  targetPrefix = "",
) {
  return (c: import("hono").Context) => {
    const path = c.req.path.replace(pathPrefix, "") || "/";
    const queryString = c.req.url.includes("?")
      ? `?${c.req.url.split("?")[1]}`
      : "";
    return proxy(
      `${config.services[service]}${targetPrefix}${path}${queryString}`,
      c.req,
    );
  };
}

export const proxyRoutes = new Hono()
  .all("/api/auth/*", createProxyHandler("auth", "/api/auth", "/api/auth"))
  .all("/api/users/*", createProxyHandler("users", "/api/users"))
  .all("/api/catalog/*", createProxyHandler("catalog", "/api/catalog"))
  .all("/api/media/*", createProxyHandler("media", "/api/media"));
