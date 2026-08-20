import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../errors/index";
// Single global error handler for all HTTP errors.
// Routes and controllers do not need their own try/catch.
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { success: false, error: { code: err.code, message: err.message } },
      err.statusCode as ContentfulStatusCode,
    );
  }

  // Log unexpected errors server-side without exposing internal details.
  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    },
    500,
  );
};