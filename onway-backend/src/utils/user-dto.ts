import type { User } from "../repositories/user.repository";

/**
 * A user object with `passwordHash` removed. This is the ONLY shape of a
 * user that should ever reach a controller response — every auth service
 * method returns this, never the raw repository `User`.
 */
export type SafeUser = Omit<User, "passwordHash">;

/** Strips `passwordHash` off a raw user row. Centralized here so there is exactly one place in the codebase responsible for this. */
export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
