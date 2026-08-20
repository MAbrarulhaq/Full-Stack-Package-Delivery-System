import { Hono } from "hono";
import { userController } from "../controllers/user.controller";
import { jwtAuth, requireRole } from "../middleware/auth";
import { validate } from "../validators/validate";
import { listUsersQuerySchema, updateUserRoleSchema, adminCreateUserSchema } from "../validators/user.validator";
import { idParamSchema } from "../validators/common.validator";


 //admin/staff only for /couriers: this is a dispatch-facing lookup (e.g.
 // populating a "who can I assign this to" dropdown before calling
// PATCH /orders/:id/assign) -- not something a courier needs to see.
 
 //admin-ONLY for / and /:id/role: full user directory + role management
 //is a business-administration capability, not a dispatch operation --
 //staff can see the courier list to assign deliveries, but cannot browse
 // every account in the system or change anyone's role.
 
export const userRoutes = new Hono();

userRoutes.get("/couriers", jwtAuth, requireRole("admin", "staff"), userController.listCouriers);

userRoutes.get(
  "/",
  jwtAuth,
  requireRole("admin"),
  validate("query", listUsersQuerySchema),
  userController.list,
);

userRoutes.post(
  "/",
  jwtAuth,
  requireRole("admin"),
  validate("json", adminCreateUserSchema),
  userController.create,
);

userRoutes.patch(
  "/:id/role",
  jwtAuth,
  requireRole("admin"),
  validate("param", idParamSchema),
  validate("json", updateUserRoleSchema),
  userController.updateRole,
);

