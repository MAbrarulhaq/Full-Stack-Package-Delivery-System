import type { Context } from "hono";
import { userService } from "../services/user.service";

/**
 * Thin, same pattern as every other controller in this project: no SQL,
 * no business logic -- just calls the service and shapes the response.
 * userService.getCouriers() already returns sanitized (no passwordHash)
 * users, so there's nothing to filter here.
 */
export const userController = {
  async listCouriers(c: Context) {
    const couriers = await userService.getCouriers();
    return c.json({ success: true, data: couriers }, 200);
  },
};
