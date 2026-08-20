import { apiRequest } from "./client";
import type { ApiSuccessEnvelope } from "./client";
import type { Courier } from "@/types/order";
import type { CreateUserPayload, ListUsersParams, ListUsersResult, ManagedUser } from "@/types/user";
import type { UserRole } from "@/types/auth";

// GET /users/couriers -- admin/staff only; used to populate the assign-courier dropdown. 
export async function getCouriers(): Promise<Courier[]> {
  const res = await apiRequest<ApiSuccessEnvelope<Courier[]>>("/users/couriers");
  return res.data;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// GET /users -- admin-only. 
export async function getUsers(params: ListUsersParams): Promise<ListUsersResult> {
  const query = buildQuery({ page: params.page, limit: params.limit, role: params.role, search: params.search });
  const res = await apiRequest<ListUsersResult & { success: true }>(`/users${query}`);
  return { data: res.data, pagination: res.pagination };
}

// PATCH /users/:id/role -- admin-only. 
export async function updateUserRole(id: string, role: UserRole): Promise<ManagedUser> {
  const res = await apiRequest<ApiSuccessEnvelope<ManagedUser>>(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return res.data;
}

// POST /users -- admin-only. 
// Creates an account with an explicit role (unlike public /auth/register, which always defaults to staff). 
export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const res = await apiRequest<ApiSuccessEnvelope<ManagedUser>>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}
