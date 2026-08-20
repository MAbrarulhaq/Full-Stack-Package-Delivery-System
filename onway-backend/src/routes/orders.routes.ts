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

// Routes only connect paths, validation, middleware, and controllers.
// No business logic or database calls belong here.

// Permissions:
// POST /            -> admin, staff
// GET /             -> admin, staff
// GET /my           -> courier
// GET /:id          -> admin, staff, courier
// PATCH /:id/status -> admin, staff
// PATCH /:id/assign -> admin, staff
// DELETE /:id       -> admin, staff

// /my must come before /:id so Hono does not treat "my" as an order ID.
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
