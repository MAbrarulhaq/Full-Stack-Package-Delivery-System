import type { Context } from "hono";

export const healthController = {
  check(c: Context) {
    return c.json(
      {
        success: true,
        message: "Onway API is running",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      200,
    );
  },
};
