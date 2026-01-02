import { z } from "zod";

export const SuccessResponse = z.object({
  success: z.literal(true),
});

export const ApiError = z.object({
  error: z.string(),
});

export const PaginationQuery = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export type ApiError = z.infer<typeof ApiError>;
export type PaginationQuery = z.infer<typeof PaginationQuery>;
