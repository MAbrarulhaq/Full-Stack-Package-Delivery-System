import type { Context, Next } from "hono";
import { verifyAuthToken } from "../utils/jwt";
import type { AuthUser } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError, InvalidTokenError } from "../errors/index";

export type { AuthUser };

const AUTH_USER_CONTEXT_KEY = "authUser";

/**
 * Centralized cast point for reading the authenticated user off Hono
 * context. This is the ONE place in the codebase that casts
 * `c.get("authUser")` -- everywhere else (controllers, requireRole)
 * calls this helper instead of touching the context variable directly,
 * per the "clean typed helper rather than scattering casts" guidance.
 */
export function getAuthUser(c: Context): AuthUser {
  const user = c.get(AUTH_USER_CONTEXT_KEY) as AuthUser | undefined;
  if (!user) {
    // Defensive: only reachable if a route uses requireRole() without
    // jwtAuth() running first, which would be a routing bug, not a
    // client error -- but 401 is still the correct response either way.
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}

/**
 * Verifies the Authorization header's Bearer JWT and attaches the
 * resulting { id, role } to Hono context for downstream handlers
 * (via getAuthUser). Does NOT query PostgreSQL -- the JWT's signature
 * and claims are sufficient proof of identity for authorization
 * purposes; only GET /auth/me re-reads the user row, because it
 * specifically needs the current name/email/etc.
 */
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

  // verifyAuthToken throws InvalidTokenError/ExpiredTokenError itself on
  // failure -- both are AppError subclasses, so app.onError handles them
  // without any try/catch needed here.
  const authUser = await verifyAuthToken(token);

  c.set(AUTH_USER_CONTEXT_KEY, authUser);
  await next();
}

/**
 * Role guard. Must run AFTER jwtAuth() in the middleware chain for a
 * given route -- it reads the identity jwtAuth attached, it doesn't
 * verify the token itself.
 *
 *   orderRoutes.patch("/:id/status", jwtAuth, requireRole("admin", "staff"), ...)
 */
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
