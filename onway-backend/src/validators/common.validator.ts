import { z } from "zod";

/** Validates a route param named `id` as a UUID. Used by every :id route. */
export const idParamSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
});

export type IdParam = z.infer<typeof idParamSchema>;

/**
 * Shared pagination query shape. `page`/`limit` arrive as strings on the
 * query string, so they're coerced to numbers before the min/max checks
 * run. Defaults and the max limit live here once, so no controller or
 * route re-implements pagination clamping.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
