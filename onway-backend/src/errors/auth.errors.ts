import { UnauthorizedError, ConflictError } from "./app-error";

/**
 * Deliberately generic message — never reveals whether the email exists
 * or the password was wrong. Used for BOTH "no such user" and "wrong
 * password" in the login flow, by design (see user.service.ts).
 */
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

/** Missing/malformed Authorization header, or a token that fails signature/claim verification. */
export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super("Invalid or malformed authentication token", "INVALID_TOKEN");
  }
}

/** A token that verifies but is past its expiration time — distinct code from InvalidTokenError. */
export class ExpiredTokenError extends UnauthorizedError {
  constructor() {
    super("Authentication token has expired", "TOKEN_EXPIRED");
  }
}
