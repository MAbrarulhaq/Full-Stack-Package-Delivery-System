import { UnauthorizedError, ConflictError } from "./app-error";

// Generic login error that does not reveal whether the email or password was wrong.
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
  }
}

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super("This email is already registered", "EMAIL_ALREADY_REGISTERED");
  }
}

// Thrown when the Authorization header or token is invalid.
export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super("Invalid or malformed authentication token", "INVALID_TOKEN");
  }
}

// Thrown when a valid token has expired.
export class ExpiredTokenError extends UnauthorizedError {
  constructor() {
    super("Authentication token has expired", "TOKEN_EXPIRED");
  }
}