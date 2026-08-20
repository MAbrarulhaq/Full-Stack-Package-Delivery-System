import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getAllowedTransitions } from "@/lib/order-status";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { updateOrderStatus } from "@/api/orders";
import { ApiError, NetworkError } from "@/api/client";
import { invalidateOrderQueries } from "@/lib/query-invalidation";
import type { OrderStatus } from "@/types/order";

interface UpdateStatusControlProps {
  orderId: string;
  currentStatus: OrderStatus;
}


 //Only offers the transitions getAllowedTransitions() returns for the
 //order's current status -- never a full list of every enum value. The
 //backend's own state machine is still the actual authority: if it ever
 //disagrees with this list, the mutation fails and the real backend
 // error is shown rather than the UI pretending it succeeded.
 
export function UpdateStatusControl({ orderId, currentStatus }: UpdateStatusControlProps) {
  const queryClient = useQueryClient();
  const allowed = getAllowedTransitions(currentStatus).filter((s) => s !== "cancelled");
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      setNextStatus("");
      invalidateOrderQueries(queryClient, orderId);
    },
    onError: (err) => {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
  });

  if (allowed.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-status-cancelled/30 bg-status-cancelled-bg px-3.5 py-3 text-sm text-status-cancelled"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Select
          aria-label="Update status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
          disabled={mutation.isPending}
          className="w-48"
        >
          <option value="" disabled>
            Move to…
          </option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          disabled={!nextStatus || mutation.isPending}
          onClick={() => {
            setErrorMessage(null);
            if (nextStatus) mutation.mutate(nextStatus);
          }}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
        </Button>
      </div>
    </div>
  );
}
