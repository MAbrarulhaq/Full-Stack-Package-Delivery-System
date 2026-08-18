import { z } from "zod";

/**
 * `.strict()` rejects any unexpected field — including `role` or
 * `passwordHash` — so a client can never influence its own role or
 * inject a pre-hashed password at registration. Role always comes from
 * the `users.role` column default (`staff`), enforced by never reading
 * `role` off this validated body anywhere in the service.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    email: z.string().trim().toLowerCase().email("must be a valid email address"),
    password: z.string().min(8, "password must be at least 8 characters long"),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("must be a valid email address"),
    password: z.string().min(1, "password is required"),
  })
  .strict();

export type LoginBody = z.infer<typeof loginSchema>;
