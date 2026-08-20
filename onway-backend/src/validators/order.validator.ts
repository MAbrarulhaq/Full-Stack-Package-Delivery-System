import { z } from "zod";
import { ORDER_STATUSES } from "../domain/order-status";
import { paginationQuerySchema } from "./common.validator";

export const orderStatusSchema = z.enum(ORDER_STATUSES);
// Order status values accepted by the API.

// POST /orders body.
// Strict validation prevents unexpected fields such as `status`.
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

// GET /orders query parameters.
export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

// PATCH /orders/:id/status body.
export const updateOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
  })
  .strict();

export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;

// PATCH /orders/:id/assign body.
export const assignCourierSchema = z
  .object({
    courierId: z.string().uuid({ message: "courierId must be a valid UUID" }),
  })
  .strict();

export type AssignCourierBody = z.infer<typeof assignCourierSchema>;