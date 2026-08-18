import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";

/**
 * Deliberately minimal for Step 7.3 -- real KPI/analytics content is a
 * later step (needs a decision on how to derive honest numbers from the
 * existing API; see the Step 7 planning discussion). This page exists
 * only to prove the authenticated shell + routing works end-to-end.
 */
export function Dashboard() {
  const { user } = useAuth();

  return (
    <AppShell title="Overview" description="Monitor your deliveries and operations">
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium text-foreground">
          Welcome{user ? `, ${user.name}` : ""}
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          The dashboard is under construction. Order management and delivery
          tracking are coming in the next steps.
        </p>
      </div>
    </AppShell>
  );
}
