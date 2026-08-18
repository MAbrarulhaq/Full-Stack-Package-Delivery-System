import "dotenv/config";
import { z } from "zod";

/**
 * All environment variables the app depends on, validated once at startup.
 * Failing fast here (instead of getting an undefined DATABASE_URL deep
 * inside a query) is deliberate: a misconfigured deployment should crash
 * immediately with a clear message, not at the first incoming request.
 *
 * JWT_SECRET/JWT_EXPIRES_IN are required as of Step 4 — the auth
 * middleware (src/middleware/auth.ts) and JWT utility (src/utils/jwt.ts)
 * both depend on them, so the app should refuse to start rather than
 * silently run with authentication broken.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid postgres connection string"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — see errors above.");
}

export const env = parsed.data;
export type Env = typeof env;
