import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, fetchCurrentUser } from "@/api/auth";
import { setAuthToken } from "@/api/client";
import { tokenStorage } from "@/lib/token-storage";
import type { AuthUser } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Re-fetches GET /auth/me and updates the in-memory user. Used after an admin changes their OWN role from the Users page, 
   //so the displayed name/role/nav reflect the DB immediately. 
   // Does NOT reissue the JWT -- see the docstring on updateUserRole in api/users.ts 
   // for why permission-gated actions still need a fresh login. 
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // On mount: if this tab already has a stored token, verify it's still
  // valid via GET /auth/me before considering the user authenticated --
  // an expired or tampered token should not grant access. The token is
  // read via tokenStorage (sessionStorage under the hood), so it's
  // scoped to this tab only -- a page refresh preserves it, but it
  // never leaks to or gets overwritten by another tab.
  useEffect(() => {
    const storedToken = tokenStorage.get();
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
        tokenStorage.clear();
        setAuthToken(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    tokenStorage.set(result.token);
    setAuthToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setAuthToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    const fetchedUser = await fetchCurrentUser();
    setUser(fetchedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}