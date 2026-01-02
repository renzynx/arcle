import { z } from "zod";

export const createGenreBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const updateGenreBody = createGenreBody.partial();
