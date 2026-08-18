import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { env } from "../config/env";
import type { UserRole } from "../repositories/user.repository";
import { InvalidTokenError, ExpiredTokenError } from "../errors/index";

/** The identity carried by a verified JWT — attached to Hono context by jwtAuth. */
export interface AuthUser {
  id: string;
  role: UserRole;
}

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Signs a JWT for the given user. Payload is intentionally minimal — just
 * enough identity to authorize requests (id as the standard `sub` claim,
 * role as a custom claim). No email, name, or other PII in the token.
 */
export async function signAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}

/**
 * Verifies a JWT's signature and expiration, and extracts the identity.
 * Throws ExpiredTokenError specifically for an expired-but-otherwise-valid
 * token, and InvalidTokenError for every other failure (bad signature,
 * malformed token, missing claims) — the auth middleware maps both to 401,
 * but distinct error codes are useful for client-side handling
 * (e.g. "refresh and retry" vs "log in again").
 */
export async function verifyAuthToken(token: string): Promise<AuthUser> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      throw new InvalidTokenError();
    }

    return { id: payload.sub, role: payload.role as UserRole };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      throw new ExpiredTokenError();
    }
    if (err instanceof InvalidTokenError) {
      throw err;
    }
    // Any other jose error (bad signature, malformed compact JWT, etc.)
    throw new InvalidTokenError();
  }
}
