import { Hono } from "hono";
import { userController } from "../controllers/user.controller";
import { jwtAuth, requireRole } from "../middleware/auth";

/**
 * admin/staff only: this is a dispatch-facing lookup (e.g. populating a
 * "who can I assign this to" dropdown before calling
 * PATCH /orders/:id/assign) -- not something a courier needs to see.
 */
export const userRoutes = new Hono();

userRoutes.get("/couriers", jwtAuth, requireRole("admin", "staff"), userController.listCouriers);
