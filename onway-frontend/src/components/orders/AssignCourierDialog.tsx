import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getCouriers } from "@/api/users";
import { assignCourier } from "@/api/orders";
import { ApiError, NetworkError } from "@/api/client";
import { invalidateOrderQueries } from "@/lib/query-invalidation";

interface AssignCourierDialogProps {
  orderId: string;
  currentCourierId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignCourierDialog({ orderId, currentCourierId, open, onOpenChange }: AssignCourierDialogProps) {
  const queryClient = useQueryClient();
  const [selectedCourierId, setSelectedCourierId] = useState(currentCourierId ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const couriersQuery = useQuery({
    queryKey: ["couriers"],
    queryFn: getCouriers,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (courierId: string) => assignCourier(orderId, courierId),
    onSuccess: () => {
      invalidateOrderQueries(queryClient, orderId);
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
  });

  function handleAssign() {
    setErrorMessage(null);
    if (!selectedCourierId) return;
    mutation.mutate(selectedCourierId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign courier</DialogTitle>
          <DialogDescription>Choose a courier to deliver this order.</DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-md border border-status-cancelled/30 bg-status-cancelled-bg px-3.5 py-3 text-sm text-status-cancelled"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {couriersQuery.isLoading ? (
          <p className="text-sm text-muted">Loading couriers…</p>
        ) : couriersQuery.isError ? (
          <p className="text-sm text-status-cancelled">Couldn't load couriers. Try closing and reopening this dialog.</p>
        ) : couriersQuery.data && couriersQuery.data.length === 0 ? (
          <p className="text-sm text-muted">No couriers are registered yet.</p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="courier-select">Courier</Label>
            <Select
              id="courier-select"
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              disabled={mutation.isPending}
            >
              <option value="" disabled>
                Select a courier
              </option>
              {couriersQuery.data?.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name} ({courier.email})
                </option>
              ))}
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={mutation.isPending || !selectedCourierId || couriersQuery.isLoading}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
