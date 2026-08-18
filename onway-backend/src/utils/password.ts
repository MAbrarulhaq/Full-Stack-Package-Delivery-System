import bcrypt from "bcryptjs";

/**
 * Cost factor for bcrypt. 12 is a reasonable modern default — high enough
 * to be slow for an attacker doing offline brute force, low enough not to
 * noticeably slow down registration/login on ordinary hardware.
 */
const SALT_ROUNDS = 12;

/** Hashes a plaintext password. Never log or persist the plaintext input. */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/** Compares a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
