import { z } from "zod";

export const createSeriesBody = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  author: z.string().optional(),
  status: z
    .enum(["ongoing", "completed", "hiatus", "cancelled"])
    .default("ongoing"),
  coverImage: z.string().optional(),
  genreIds: z.array(z.string()).optional(),
});

export const updateSeriesBody = createSeriesBody.partial();
