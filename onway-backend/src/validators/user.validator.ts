import { z } from "zod";
import { userRoleEnum } from "../db/schema/enums";
import { paginationQuerySchema } from "./common.validator";

export const userRoleSchema = z.enum(userRoleEnum.enumValues);

// GET /users query string — admin-only listing with optional role filter and name/email search. 
export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: userRoleSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// PATCH /users/:id/role body. `.strict()` for the same reason as the order validators: 
// reject unexpected fields outright rather than silently ignoring them. 
export const updateUserRoleSchema = z
  .object({
    role: userRoleSchema,
  })
  .strict();

export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;


 //POST /users body (admin-only). Same name/email/password rules as
 //public registration, plus an explicit `role` -- unlike registerSchema,
 //this deliberately DOES accept role, since an admin creating an
 //account is allowed to set it up front (still validated against the
 // same userRoleEnum, never a free-text string).
 
export const adminCreateUserSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    email: z.string().trim().toLowerCase().email("must be a valid email address"),
    password: z.string().min(8, "password must be at least 8 characters long"),
    role: userRoleSchema,
  })
  .strict();

export type AdminCreateUserBody = z.infer<typeof adminCreateUserSchema>;
