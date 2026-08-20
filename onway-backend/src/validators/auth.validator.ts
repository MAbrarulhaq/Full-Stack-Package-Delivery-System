import { z } from "zod";

// Rejects unexpected fields like `role` or `passwordHash`.
// The user's role always comes from the database default (`staff`).
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
