import { UsersRound, TriangleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserRoleBadge } from "./UserRoleBadge";
import type { ManagedUser } from "@/types/user";

interface UsersTableProps {
  users: ManagedUser[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onManage: (user: ManagedUser) => void;
  hasActiveFilter: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-status-cancelled" />
      <p className="text-sm font-medium text-foreground">Couldn't load users</p>
      <p className="max-w-xs text-sm text-muted">Something went wrong while fetching the user list. Try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function EmptyState({ hasActiveFilter }: { hasActiveFilter: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <UsersRound className="h-8 w-8 text-muted" />
      <p className="text-sm font-medium text-foreground">No users found</p>
      <p className="max-w-xs text-sm text-muted">
        {hasActiveFilter ? "Try a different search or role filter." : "No users exist yet."}
      </p>
    </div>
  );
}

export function UsersTable({ users, isLoading, isError, onRetry, onManage, hasActiveFilter }: UsersTableProps) {
  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }

  if (!isLoading && (!users || users.length === 0)) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState hasActiveFilter={hasActiveFilter} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3">User</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Created</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5" />
                  </tr>
                ))
              : users!.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-background/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleBadge role={u.role} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => onManage(u)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <ul className="divide-y divide-border sm:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </li>
            ))
          : users!.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <UserAvatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <UserRoleBadge role={u.role} />
                    <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onManage(u)}>
                  Manage
                </Button>
              </li>
            ))}
      </ul>
    </div>
  );
}
