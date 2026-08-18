/**
 * Base class for every typed domain/application error. Each subclass
 * carries the HTTP status it maps to and a machine-readable `code`, so
 * the single global `app.onError` handler (src/middleware/error-handler.ts)
 * can turn any thrown AppError into the consistent JSON error shape
 * without any route/controller needing its own try/catch.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — malformed or semantically invalid request input. */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(message, code);
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(message: string, code = "NOT_FOUND") {
    super(message, code);
  }
}

/** 401 — no (or invalid) credentials supplied. */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  constructor(message = "Authentication required", code = "UNAUTHORIZED") {
    super(message, code);
  }
}

/** 403 — authenticated, but not allowed to perform this action. */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  constructor(
    message = "You do not have permission to perform this action",
    code = "FORBIDDEN",
  ) {
    super(message, code);
  }
}

/** 409 — the request is well-formed but conflicts with current state. */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(message: string, code = "CONFLICT") {
    super(message, code);
  }
}
