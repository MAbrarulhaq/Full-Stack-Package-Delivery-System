import "dotenv/config";
import { z } from "zod";


 // Failing fast here (instead of getting an undefined DATABASE_URL deep
 //inside a query) is deliberate: a misconfigured deployment should crash
 //immediately with a clear message, not at the first incoming request.
 

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
  // Deployed frontend origin allowed by CORS, in addition to the local dev
  // origin below. Unset in local dev; required in production to reach the
  // API from anywhere other than localhost.
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL").optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — see errors above.");
}

export const env = parsed.data;
export type Env = typeof env;
