import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, fetchCurrentUser } from "@/api/auth";
import { setAuthToken } from "@/api/client";
import type { AuthUser } from "@/types/auth";

/** localStorage key for the JWT. No refresh-token flow exists on the backend, so this is the whole persistence story. */
const TOKEN_STORAGE_KEY = "onway_token";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // On mount: if a token is already stored, verify it's still valid via
  // GET /auth/me before considering the user authenticated -- an expired
  // or tampered token in localStorage should not grant access.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setStatus("unauthenticated");
      return;
    }

    setAuthToken(storedToken);
    fetchCurrentUser()
      .then((fetchedUser) => {
        setUser(fetchedUser);
        setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setAuthToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
