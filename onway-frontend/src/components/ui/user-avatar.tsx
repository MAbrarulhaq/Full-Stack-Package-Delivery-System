import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Initials-only avatar -- the backend's User model has no photo/avatar
 * field, so an image+fallback component (the usual shadcn Avatar) would
 * be dead weight. This is intentionally simple.
 */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name) || "?"}
    </div>
  );
}
