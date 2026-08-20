import bcrypt from "bcryptjs";

// Bcrypt cost factor for secure password hashing.
const SALT_ROUNDS = 12;

// Hashes a plaintext password. Never log or store the plaintext.
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

// Checks a plaintext password against a stored bcrypt hash.
export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
