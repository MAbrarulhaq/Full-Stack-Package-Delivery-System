import { Hono } from "hono";
import { healthController } from "../controllers/health.controller";

export const healthRoutes = new Hono();

healthRoutes.get("/", healthController.check);
