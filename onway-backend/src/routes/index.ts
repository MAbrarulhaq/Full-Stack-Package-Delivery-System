import { Hono } from "hono";
import { healthRoutes } from "./health.routes";
import { orderRoutes } from "./orders.routes";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./users.routes";

export const routes = new Hono();

routes.route("/health", healthRoutes);
routes.route("/orders", orderRoutes);
routes.route("/auth", authRoutes);
routes.route("/users", userRoutes);
