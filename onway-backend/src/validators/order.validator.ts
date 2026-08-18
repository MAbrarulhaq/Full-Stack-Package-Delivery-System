import { z } from "zod";
import { ORDER_STATUSES } from "../domain/order-status";
import { paginationQuerySchema } from "./common.validator";

export const orderStatusSchema = z.enum(ORDER_STATUSES);

/**
 * POST /orders body.
 *
 * `.strict()` is deliberate: the assessment lists `status` as a creation
 * field, but the state machine requires every new order to start at
 * `pending`. Rather than silently accepting-and-ignoring a client-sent
 * `status` (which would let a client believe it set the status when it
 * didn't), `.strict()` rejects the request outright with a 400 if any
 * unexpected field — including `status` — is present. This makes the API
 * contract explicit instead of silently diverging from what the client
 * sent. See the architecture blueprint (§M) for the full reasoning.
 */
export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(1, "customerName is required"),
    pickupAddress: z.string().trim().min(1, "pickupAddress is required"),
    dropoffAddress: z.string().trim().min(1, "dropoffAddress is required"),
    packageWeight: z.coerce
      .number({ invalid_type_error: "packageWeight must be a number" })
      .positive("packageWeight must be greater than 0"),
  })
  .strict();

export type CreateOrderBody = z.infer<typeof createOrderSchema>;

/** GET /orders query string. */
export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

/** PATCH /orders/:id/status body. */
export const updateOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
  })
  .strict();

export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;

/** PATCH /orders/:id/assign body. */
export const assignCourierSchema = z
  .object({
    courierId: z.string().uuid({ message: "courierId must be a valid UUID" }),
  })
  .strict();

export type AssignCourierBody = z.infer<typeof assignCourierSchema>;
