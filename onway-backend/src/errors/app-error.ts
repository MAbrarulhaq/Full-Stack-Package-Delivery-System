// Base class for typed application errors.
// Each error includes an HTTP status and machine-readable code.
// The global error handler converts these into a consistent JSON response.
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

// 400 — invalid request input.
export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(message, code);
  }
}

// 404 — resource not found.
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(message: string, code = "NOT_FOUND") {
    super(message, code);
  }
}

// 401 — missing or invalid credentials.
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  constructor(message = "Authentication required", code = "UNAUTHORIZED") {
    super(message, code);
  }
}

// 403 — authenticated but not authorized.
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  constructor(
    message = "You do not have permission to perform this action",
    code = "FORBIDDEN",
  ) {
    super(message, code);
  }
}

// 409 — request conflicts with the current state.
export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(message: string, code = "CONFLICT") {
    super(message, code);
  }
}