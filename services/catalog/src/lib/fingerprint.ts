import type { Context } from "hono";

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getClientIp(c: Context): string {
  const headers = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-client-ip",
    "true-client-ip",
    "x-forwarded-for",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
    "x-cluster-client-ip",
    "fastly-client-ip",
    "x-original-forwarded-for",
    "x-appengine-user-ip",
    "fly-client-ip",
    "cf-pseudo-ipv4",
    "x-envoy-external-address",
    "x-azure-clientip",
    "x-azure-socketip",
    "x-vercel-forwarded-for",
    "x-render-client-ip",
    "x-railway-client-ip",
  ];

  for (const header of headers) {
    const value = c.req.header(header);
    if (value) {
      const ip = value.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }

  return "unknown";
}

export function getFingerprint(c: Context): string {
  const user = c.get("user");
  if (user?.sub) {
    return `user:${user.sub}`;
  }

  const ip = getClientIp(c);
  const ua = c.req.header("user-agent") || "unknown";
  const uaHash = hashCode(ua);

  return `anon:${ip}:${uaHash}`;
}
