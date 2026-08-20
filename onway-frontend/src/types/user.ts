import type { AuthUser, UserRole } from "./auth";
import type { PaginationMeta } from "./order";

export type { UserRole };

// A user row as returned by GET /users / PATCH /users/:id/role -- same safe shape as AuthUser (no passwordHash). 
export type ManagedUser = AuthUser;

export interface ListUsersParams {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
}

export interface ListUsersResult {
  data: ManagedUser[];
  pagination: PaginationMeta;
}

/** POST /users body (admin-only). */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const USER_ROLES: readonly UserRole[] = ["admin", "staff", "courier"];
