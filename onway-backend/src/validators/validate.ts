import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { ValidationError } from "../errors/index";

/**
 * Thin wrapper around @hono/zod-validator's `zValidator`. On failure, it
 * throws a `ValidationError` instead of letting zValidator write its own
 * ad-hoc 400 response — that way every validation failure (body, query,
 * or param) flows through the single global `app.onError` handler and
 * comes back in the same `{ success: false, error: { code, message } }`
 * shape as every other error in the app, rather than a one-off format
 * unique to validation.
 */
export function validate<T extends ZodSchema>(
  target: "json" | "query" | "param",
  schema: T,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      const message = result.error.errors
        .map((issue) => `${issue.path.join(".") || target}: ${issue.message}`)
        .join("; ");
      throw new ValidationError(message);
    }
  });
}
