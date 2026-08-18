import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/layout/FullPageLoader";

/** Redirects unauthenticated users to /login. Shows a full-page loader while auth status is still being determined. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullPageLoader />;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Redirects already-authenticated users away from /login to /dashboard. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullPageLoader />;
  }
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
