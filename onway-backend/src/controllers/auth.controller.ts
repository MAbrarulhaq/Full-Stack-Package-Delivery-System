import type { Context } from "hono";
import { userService } from "../services/user.service";
import type { RegisterBody, LoginBody } from "../validators/auth.validator";
import { getAuthUser } from "../middleware/auth";

export const authController = {
  async register(c: Context) {
    const body = c.req.valid("json" as never) as RegisterBody;
    const user = await userService.register(body);
    return c.json({ success: true, data: user }, 201);
  },

  async login(c: Context) {
    const body = c.req.valid("json" as never) as LoginBody;
    const { user, token } = await userService.login(body);
    return c.json({ success: true, data: { user, token } }, 200);
  },

  async me(c: Context) {
    const authUser = getAuthUser(c);
    const user = await userService.getCurrentUser(authUser.id);
    return c.json({ success: true, data: user }, 200);
  },
};
