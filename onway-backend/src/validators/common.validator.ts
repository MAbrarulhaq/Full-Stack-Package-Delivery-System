import { z } from "zod";

// Validates a route param named `id` as a UUID. Used by every :id route.
export const idParamSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
});

export type IdParam = z.infer<typeof idParamSchema>;

// Shared pagination schema. Converts query strings to numbers and applies
// defaults and limits in one place.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
