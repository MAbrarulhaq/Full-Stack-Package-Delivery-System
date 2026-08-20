import type { User } from "../repositories/user.repository";

// User shape without passwordHash.
// This is the only user shape returned by auth services.
export type SafeUser = Omit<User, "passwordHash">;

// Removes passwordHash before returning a user to controllers.
export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}