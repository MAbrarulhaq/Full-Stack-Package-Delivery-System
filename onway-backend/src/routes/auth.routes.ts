import { Hono } from "hono";
import { validate } from "../validators/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authController } from "../controllers/auth.controller";
import { jwtAuth } from "../middleware/auth";

export const authRoutes = new Hono();

authRoutes.post("/register", validate("json", registerSchema), authController.register);

authRoutes.post("/login", validate("json", loginSchema), authController.login);

authRoutes.get("/me", jwtAuth, authController.me);
