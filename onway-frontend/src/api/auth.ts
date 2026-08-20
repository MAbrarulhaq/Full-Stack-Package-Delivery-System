import { apiRequest } from "./client";
import type { ApiSuccessEnvelope } from "./client";
import type {
  AuthUser,
  LoginPayload,
  LoginResult,
  RegisterPayload,
} from "@/types/auth";


 // POST /auth/login
export async function login(
  payload: LoginPayload,
): Promise<LoginResult> {
  const res = await apiRequest<ApiSuccessEnvelope<LoginResult>>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return res.data;
}


 // POST /auth/register

export async function register(
  payload: RegisterPayload,
): Promise<AuthUser> {
  const res = await apiRequest<ApiSuccessEnvelope<AuthUser>>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return res.data;
}


 // GET /auth/me
 
export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await apiRequest<ApiSuccessEnvelope<AuthUser>>(
    "/auth/me",
  );

  return res.data;
}