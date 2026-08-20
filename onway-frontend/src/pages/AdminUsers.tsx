import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UsersTable } from "@/components/admin/UsersTable";
import { ManageUserDialog } from "@/components/admin/ManageUserDialog";
import { Pagination } from "@/components/orders/Pagination";
import { getUsers } from "@/api/users";
import { USER_ROLES } from "@/types/user";
import type { ManagedUser } from "@/types/user";
import type { UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  courier: "Courier",
};


 //Admin-only (see routes/ProtectedRoute.tsx AdminRoute, and the actual
 //enforcement on the backend: GET/POST /users and PATCH /users/:id/role
 //all require requireRole("admin")). Search and role filtering are real
 // server-side query params (see api/users.ts getUsers) -- never
// client-side filtering over a single fetched page.
 
export function AdminUsers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ["users", { page, limit, role: role || undefined, search: search || undefined }] as const,
    queryFn: () => getUsers({ page, limit, role: role || undefined, search: search || undefined }),
  });

  const [manageTarget, setManageTarget] = useState<ManagedUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleManage(user: ManagedUser) {
    setManageTarget(user);
    setDialogOpen(true);
  }

  function handleRoleFilterChange(next: UserRole | "") {
    setRole(next);
    setPage(1);
  }

  return (
    <AppShell title="Users" description="Manage staff, couriers, and administrators.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs space-y-1.5">
            <Label htmlFor="user-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="user-search"
                placeholder="Search users…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-40 space-y-1.5">
            <Label htmlFor="role-filter">Role</Label>
            <Select
              id="role-filter"
              value={role}
              onChange={(e) => handleRoleFilterChange(e.target.value as UserRole | "")}
            >
              <option value="">All roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <UsersTable
          users={usersQuery.data?.data}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          onRetry={() => usersQuery.refetch()}
          onManage={handleManage}
          hasActiveFilter={!!search || !!role}
        />

        {usersQuery.data ? (
          <Pagination pagination={usersQuery.data.pagination} onPageChange={setPage} />
        ) : null}
      </div>

      <ManageUserDialog user={manageTarget} open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}
