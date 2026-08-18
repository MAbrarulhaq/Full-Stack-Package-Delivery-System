import { Hono } from "hono";
import { validate } from "../validators/validate";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  assignCourierSchema,
} from "../validators/order.validator";
import { idParamSchema, paginationQuerySchema } from "../validators/common.validator";
import { orderController } from "../controllers/order.controller";
import { jwtAuth, requireRole } from "../middleware/auth";

/**
 * Pure wiring: HTTP method + path + validator + middleware + controller
 * handler. No business logic and no database calls live in this file --
 * see order.service.ts / order.repository.ts.
 *
 * Route permission policy:
 *   POST   /             -> admin, staff   (creating an order is a dispatch action)
 *   GET    /             -> admin, staff   (full order-book listing is an ops view)
 *   GET    /my           -> courier only   (own assigned orders; courierId comes from the JWT, never the client)
 *   GET    /:id          -> admin, staff, courier -- but see getOrderByIdForUser in
 *                            order.service.ts: a courier can only view an order they
 *                            are assigned to. requireRole here only proves the caller
 *                            IS a courier, not that they own THIS order -- the
 *                            per-order ownership check happens in the service layer.
 *   PATCH  /:id/status   -> admin, staff   (explicit assessment requirement)
 *   PATCH  /:id/assign   -> admin, staff   (courier assignment is a dispatch action)
 *   DELETE /:id          -> admin, staff   (cancellation is a dispatch action)
 *
 * IMPORTANT: "/my" is registered BEFORE "/:id". Hono's router would
 * otherwise match GET /orders/my against the "/:id" pattern (":id" binds
 * to any single path segment, including the literal string "my"), and
 * the UUID validator on that route would reject "my" with a 400 before
 * the request ever reached the dedicated /my handler.
 */
export const orderRoutes = new Hono();

orderRoutes.post(
  "/",
  jwtAuth,
  requireRole("admin", "staff"),
  validate("json", createOrderSchema),
  orderController.create,
);

orderRoutes.get(
  "/",
  jwtAuth,
  requireRole("admin", "staff"),
  validate("query", listOrdersQuerySchema),
  orderController.list,
);

orderRoutes.get(
  "/my",
  jwtAuth,
  requireRole("courier"),
  validate("query", paginationQuerySchema),
  orderController.myOrders,
);

orderRoutes.get(
  "/:id",
  jwtAuth,
  requireRole("admin", "staff", "courier"),
  validate("param", idParamSchema),
  orderController.getById,
);

orderRoutes.patch(
  "/:id/status",
  jwtAuth,
  requireRole("admin", "staff"),
  validate("param", idParamSchema),
  validate("json", updateOrderStatusSchema),
  orderController.updateStatus,
);

orderRoutes.patch(
  "/:id/assign",
  jwtAuth,
  requireRole("admin", "staff"),
  validate("param", idParamSchema),
  validate("json", assignCourierSchema),
  orderController.assign,
);

orderRoutes.delete("/:id", jwtAuth, requireRole("admin", "staff"), validate("param", idParamSchema), orderController.cancel);
