import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserRoleBadge } from "./UserRoleBadge";
import { updateUserRole } from "@/api/users";
import { ApiError, NetworkError } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/types/user";
import type { ManagedUser } from "@/types/user";
import type { UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  courier: "Courier",
};

interface ManageUserDialogProps {
  user: ManagedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function ManageUserDialog({ user, open, onOpenChange }: ManageUserDialogProps) {
  const queryClient = useQueryClient();
  const { user: currentUser, refreshUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset local state whenever a different user is opened, or the dialog closes.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedRole("");
      setConfirming(false);
      setErrorMessage(null);
    }
    onOpenChange(next);
  }

  const mutation = useMutation({
    mutationFn: (role: UserRole) => updateUserRole(user!.id, role),
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "users" });
      if (currentUser && updated.id === currentUser.id) {
        // The admin changed their OWN role -- refresh the displayed
        // user/nav immediately. Their existing JWT still carries the
        // OLD role for permission checks until they log in again (see
        // the JWT/role-change note in the backend's user.service.ts) --
        // refreshUser() only updates what's *shown*, not what's granted.
        await refreshUser();
      }
      handleOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
  });

  if (!user) return null;

  const isSelf = currentUser?.id === user.id;
  const hasChange = !!selectedRole && selectedRole !== user.role;

  function handleContinue() {
    if (!hasChange) return;
    setConfirming(true);
  }

  function handleConfirm() {
    if (!selectedRole) return;
    setErrorMessage(null);
    mutation.mutate(selectedRole);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {!confirming ? (
          <>
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 px-3.5 py-3">
              <UserAvatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-md border border-status-cancelled/30 bg-status-cancelled-bg px-3.5 py-3 text-sm text-status-cancelled"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-muted">Current role</p>
                <div className="mt-1.5">
                  <UserRoleBadge role={user.role} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-role">Change role</Label>
                <Select
                  id="new-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
                {isSelf ? (
                  <p className="text-xs text-muted">
                    This is your own account. Changing your role won't take full effect until you sign in again.
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleContinue} disabled={!hasChange}>
                Save changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Change user role?</DialogTitle>
              <DialogDescription>
                You are changing {user.name}'s role from {ROLE_LABELS[user.role]} to{" "}
                {ROLE_LABELS[selectedRole as UserRole]}. This will change the permissions available to this account.
              </DialogDescription>
            </DialogHeader>

            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-status-cancelled/30 bg-status-cancelled-bg px-3.5 py-3 text-sm text-status-cancelled"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
