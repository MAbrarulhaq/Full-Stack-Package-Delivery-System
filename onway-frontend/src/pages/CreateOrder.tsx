import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, TriangleAlert, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/api/orders";
import { ApiError, NetworkError } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { invalidateOrderQueries } from "@/lib/query-invalidation";


export function CreateOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();


  useEffect(() => {
    if (user?.role === "courier") {
      navigate("/orders", { replace: true });
    }
  }, [user, navigate]);

  const [customerName, setCustomerName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      invalidateOrderQueries(queryClient);
      navigate(`/orders/${order.id}`, { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setApiErrorMessage(err.message);
      } else {
        setApiErrorMessage("Something went wrong. Please try again.");
      }
    },
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.customerName = "Customer name is required";
    if (!pickupAddress.trim()) errors.pickupAddress = "Pickup address is required";
    if (!dropoffAddress.trim()) errors.dropoffAddress = "Drop-off address is required";

    const weight = Number(packageWeight);
    if (!packageWeight.trim() || Number.isNaN(weight)) {
      errors.packageWeight = "Package weight must be a number";
    } else if (weight <= 0) {
      errors.packageWeight = "Package weight must be greater than 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiErrorMessage(null);
    if (!validate()) return;

    mutation.mutate({
      customerName: customerName.trim(),
      pickupAddress: pickupAddress.trim(),
      dropoffAddress: dropoffAddress.trim(),
      packageWeight: Number(packageWeight),
    });
  }

  return (
    <AppShell title="Create Order" description="Dispatch a new delivery order">
      <div className="mx-auto max-w-xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>

        <div className="rounded-lg border border-border bg-surface p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {apiErrorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-status-cancelled/30 bg-status-cancelled-bg px-3.5 py-3 text-sm text-status-cancelled"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{apiErrorMessage}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                disabled={mutation.isPending}
                aria-invalid={!!fieldErrors.customerName}
                aria-describedby={fieldErrors.customerName ? "customerName-error" : undefined}
              />
              {fieldErrors.customerName ? (
                <p id="customerName-error" className="text-xs text-status-cancelled">
                  {fieldErrors.customerName}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup address</Label>
                <Input
                  id="pickupAddress"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="123 Warehouse Rd"
                  disabled={mutation.isPending}
                  aria-invalid={!!fieldErrors.pickupAddress}
                  aria-describedby={fieldErrors.pickupAddress ? "pickupAddress-error" : undefined}
                />
                {fieldErrors.pickupAddress ? (
                  <p id="pickupAddress-error" className="text-xs text-status-cancelled">
                    {fieldErrors.pickupAddress}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffAddress">Drop-off address</Label>
                <Input
                  id="dropoffAddress"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="456 Customer Ave"
                  disabled={mutation.isPending}
                  aria-invalid={!!fieldErrors.dropoffAddress}
                  aria-describedby={fieldErrors.dropoffAddress ? "dropoffAddress-error" : undefined}
                />
                {fieldErrors.dropoffAddress ? (
                  <p id="dropoffAddress-error" className="text-xs text-status-cancelled">
                    {fieldErrors.dropoffAddress}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageWeight">Package weight</Label>
              <Input
                id="packageWeight"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={packageWeight}
                onChange={(e) => setPackageWeight(e.target.value)}
                placeholder="3.50"
                disabled={mutation.isPending}
                aria-invalid={!!fieldErrors.packageWeight}
                aria-describedby={fieldErrors.packageWeight ? "packageWeight-error" : undefined}
              />
              {fieldErrors.packageWeight ? (
                <p id="packageWeight-error" className="text-xs text-status-cancelled">
                  {fieldErrors.packageWeight}
                </p>
              ) : (
                <p className="text-xs text-muted">Must be greater than 0.</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/orders")} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
