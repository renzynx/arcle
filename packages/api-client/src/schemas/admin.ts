import { z } from "zod";

export const RecentActivity = z.object({
  type: z.enum(["chapter", "series"]),
  id: z.string(),
  title: z.string(),
  seriesId: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const AdminStats = z.object({
  totalViews: z.number(),
  storageUsed: z.string(),
  storageBytes: z.number(),
  recentActivity: z.array(RecentActivity),
});

export const ServiceStatus = z.object({
  status: z.enum(["ok", "error", "down"]),
  latency: z.number().nullable(),
});

export const SystemHealth = z.object({
  memory: z.object({
    used: z.string(),
    percentage: z.number().nullable(),
  }),
  uptime: z.string(),
  services: z.record(z.string(), ServiceStatus),
  avgLatency: z.number().nullable(),
  responseTime: z.number(),
});

export type RecentActivity = z.infer<typeof RecentActivity>;
export type AdminStats = z.infer<typeof AdminStats>;
export type ServiceStatus = z.infer<typeof ServiceStatus>;
export type SystemHealth = z.infer<typeof SystemHealth>;
