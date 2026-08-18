import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../errors/index";

/**
 * The ONE place in the app that turns a thrown error into an HTTP
 * response. Wired into `app.onError` in src/app.ts — no route or
 * controller has its own try/catch; every service method just throws
 * a typed AppError (or lets an unexpected error propagate) and this
 * handler does the rest.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { success: false, error: { code: err.code, message: err.message } },
      err.statusCode as ContentfulStatusCode,
    );
  }

  // Unknown/unexpected error (e.g. a raw database error). Never leak
  // stack traces, SQL, or internals to the client — log server-side only.
  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    },
    500,
  );
};
