import { z } from "zod";

export const paginationQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["latest", "popular"]).default("latest"),
});

export const idParam = z.object({
  id: z.string().min(1),
});

export const slugParam = z.object({
  slug: z.string().min(1),
});

export const chaptersPaginationQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["latest", "oldest", "number", "-number"]).default("number"),
  search: z.string().optional(),
});

export const adminPaginationQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});
