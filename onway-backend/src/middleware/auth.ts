import type { Context, Next } from "hono";
import { verifyAuthToken } from "../utils/jwt";
import type { AuthUser } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError, InvalidTokenError } from "../errors/index";

export type { AuthUser };

const AUTH_USER_CONTEXT_KEY = "authUser";

// Safely reads the authenticated user from Hono context.
export function getAuthUser(c: Context): AuthUser {
  const user = c.get(AUTH_USER_CONTEXT_KEY) as AuthUser | undefined;
  if (!user) {
    // Defensive check if jwtAuth() was not run before this middleware.
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}

// Verifies the Bearer JWT and attaches the authenticated user to context.
// Does not query the database; the token provides the required identity claims.
export async function jwtAuth(c: Context, next: Next): Promise<void> {
  const header = c.req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "Authentication required (expected 'Authorization: Bearer <token>')",
    );
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new InvalidTokenError();
  }

  // Token verification errors are handled by the global error handler.
  const authUser = await verifyAuthToken(token);

  c.set(AUTH_USER_CONTEXT_KEY, authUser);
  await next();
}

// Checks whether the authenticated user has one of the required roles.
// Must run after jwtAuth().
export function requireRole(...roles: AuthUser["role"][]) {
  return async (c: Context, next: Next): Promise<void> => {
    const authUser = getAuthUser(c);
    if (!roles.includes(authUser.role)) {
      throw new ForbiddenError(
        `This action requires one of the following roles: ${roles.join(", ")}`,
      );
    }
    await next();
  };
}