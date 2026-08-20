import type { Context } from "hono";
import { userService } from "../services/user.service";
import type { ListUsersQuery, UpdateUserRoleBody, AdminCreateUserBody } from "../validators/user.validator";
import type { IdParam } from "../validators/common.validator";


 //Thin, same pattern as every other controller in this project: no SQL,
 //no business logic -- just calls the service and shapes the response.
 //userService.getCouriers()/listUsers()/updateUserRole() already return
 // sanitized (no passwordHash) users, so there's nothing to filter here.
 
export const userController = {
  async listCouriers(c: Context) {
    const couriers = await userService.getCouriers();
    return c.json({ success: true, data: couriers }, 200);
  },

  // GET /users -- admin-only, enforced by requireRole("admin") in users.routes.ts. 
  async list(c: Context) {
    const query = c.req.valid("query" as never) as ListUsersQuery;
    const result = await userService.listUsers(query);
    return c.json({ success: true, ...result }, 200);
  },

  // PATCH /users/:id/role -- admin-only. 
  async updateRole(c: Context) {
    const { id } = c.req.valid("param" as never) as IdParam;
    const { role } = c.req.valid("json" as never) as UpdateUserRoleBody;
    const user = await userService.updateUserRole(id, role);
    return c.json({ success: true, data: user }, 200);
  },

  // POST /users -- admin-only. Creates an account with an explicit role, unlike public registration. 
  async create(c: Context) {
    const body = c.req.valid("json" as never) as AdminCreateUserBody;
    const user = await userService.createUserAsAdmin(body);
    return c.json({ success: true, data: user }, 201);
  },
};
