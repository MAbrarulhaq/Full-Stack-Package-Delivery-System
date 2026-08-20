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
import { cancelOrder } from "@/api/orders";
import { ApiError, NetworkError } from "@/api/client";
import { invalidateOrderQueries } from "@/lib/query-invalidation";

interface CancelOrderDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


 // DELETE /orders/:id is a soft cancellation on the backend (sets
 //status='cancelled' + cancelledAt, never removes the row) -- this
 //dialog's copy says exactly that, and there is no separate "hard
 //delete" action anywhere in the frontend.
 
export function CancelOrderDialog({ orderId, open, onOpenChange }: CancelOrderDialogProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            This marks the order as cancelled and records it in the status history. It cannot be undone, and the
            order cannot be moved to another status afterward.
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Keep order
          </Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Cancel order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
