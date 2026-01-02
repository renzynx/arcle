import { getSetting, getSettingBool } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import { Hono } from "hono";
import { config } from "../config.ts";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function checkServiceHealth(name: string, url: string) {
  const checkStart = Date.now();
  try {
    const res = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const latency = Date.now() - checkStart;
    const data = (await res.json()) as { memory?: { rss?: number } };
    return {
      name: name.toLowerCase(),
      status: res.ok ? "ok" : "error",
      latency,
      rss: data.memory?.rss ?? 0,
    };
  } catch {
    return {
      name: name.toLowerCase(),
      status: "down",
      latency: null as number | null,
      rss: 0,
    };
  }
}

export const healthRoutes = new Hono()
  .get("/health", (c) => c.json({ status: "ok", service: "gateway" }))

  .get("/stats/health", async (c) => {
    const startTime = Date.now();
    const gatewayMem = process.memoryUsage();

    const serviceChecks = await Promise.allSettled(
      Object.entries(config.services).map(([name, url]) =>
        checkServiceHealth(name, url),
      ),
    );

    const services: Record<string, { status: string; latency: number | null }> =
      {};
    let totalLatency = 0;
    let healthyCount = 0;
    let totalRss = gatewayMem.rss;

    for (const result of serviceChecks) {
      if (result.status === "fulfilled") {
        const { name, status, latency, rss } = result.value;
        services[name] = { status, latency };
        totalRss += rss;
        if (latency !== null) {
          totalLatency += latency;
          healthyCount++;
        }
      }
    }

    return c.json({
      memory: {
        used: formatBytes(totalRss),
        percentage: null,
      },
      uptime: formatUptime(process.uptime()),
      services,
      avgLatency:
        healthyCount > 0 ? Math.round(totalLatency / healthyCount) : null,
      responseTime: Date.now() - startTime,
    });
  })

  .get("/status", async (c) => {
    const maintenance = await getSettingBool(
      SettingKey.MAINTENANCE_MODE,
      false,
    );
    const message = maintenance
      ? await getSetting(SettingKey.MAINTENANCE_MESSAGE)
      : null;

    return c.json({
      maintenance,
      message: message || null,
    });
  });
