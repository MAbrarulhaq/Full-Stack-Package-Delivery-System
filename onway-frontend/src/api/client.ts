import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@/types/api";


 // Backend URL comes from an env var, never hardcoded (see .env.example).
 // Falls back to the known local dev port only as a convenience default.
 
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Thrown for every non-2xx or {success:false} response, carrying the backend's own error code/message. 
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

//Thrown when the network request itself fails (server unreachable, CORS, offline, etc.) -- distinct from an API error response.
export class NetworkError extends Error {
  constructor() {
    super("Unable to reach the server. Check your connection and try again.");
    this.name = "NetworkError";
  }
}

let authToken: string | null = null;

//Called by AuthContext on login/logout/init -- keeps the token used by every request in one place. 
export function setAuthToken(token: string | null): void {
  authToken = token;
}


 // Makes a request against the Onway API and returns the parsed JSON body
 // (the full envelope, e.g. { success, data, pagination? }) typed as T.
 //Throws ApiError for any backend error response (using the real
 //code/message from src/errors/), or NetworkError if the request never
 //reached the server.
 
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new NetworkError();
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, "INVALID_RESPONSE", "The server returned an unexpected response.");
  }

  if (!response.ok || (body as ApiErrorEnvelope).success === false) {
    const errBody = body as ApiErrorEnvelope;
    throw new ApiError(
      response.status,
      errBody.error?.code ?? "UNKNOWN_ERROR",
      errBody.error?.message ?? "Something went wrong.",
    );
  }

  return body as T;
}

export type { ApiSuccessEnvelope };
