import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  courier: "Courier",
};

// Reuses existing tokens rather than inventing new colors: primary for admin, 
// a neutral outline for staff, the existing "in transit" indigo token for courier 
// (already established elsewhere as the color tied to active delivery work). 
const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary",
  staff: "bg-background text-muted border border-border",
  courier: "bg-status-in-transit-bg text-status-in-transit",
};

export function UserRoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
