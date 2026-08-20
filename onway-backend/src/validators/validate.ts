import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { ValidationError } from "../errors/index";

// Wraps zValidator so validation errors use the app's standard error format.
// All body, query, and param validation errors go through the global handler.
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
