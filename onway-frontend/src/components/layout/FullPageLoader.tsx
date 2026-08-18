import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while auth status is "loading" (checking a stored token against
 * GET /auth/me on app start). Prevents a flash of the login page before
 * redirecting an already-authenticated user -- explicitly required.
 */
export function FullPageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
