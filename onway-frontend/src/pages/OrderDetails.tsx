import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TriangleAlert, RotateCw, UserPlus, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { UpdateStatusControl } from "@/components/orders/UpdateStatusControl";
import { AssignCourierDialog } from "@/components/orders/AssignCourierDialog";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { useAuth } from "@/hooks/useAuth";
import { getOrder } from "@/api/orders";
import { getCouriers } from "@/api/users";
import { canCancel } from "@/lib/order-status";


export function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "staff";

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id as string),
    enabled: !!id,
  });

  const couriersQuery = useQuery({
    queryKey: ["couriers"],
    queryFn: getCouriers,
    enabled: canManage,
  });

  const courierNames = useMemo(() => {
    const map = new Map<string, string>();
    couriersQuery.data?.forEach((c) => map.set(c.id, c.name));
    if (user) map.set(user.id, user.name);
    return map;
  }, [couriersQuery.data, user]);

  const order = orderQuery.data;

  return (
    <AppShell title="Order Details" description={order ? undefined : "Loading order…"}>
      <div className="mx-auto max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>

        {orderQuery.isLoading ? (
          <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : orderQuery.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-16 text-center">
            <TriangleAlert className="h-8 w-8 text-status-cancelled" />
            <p className="text-sm font-medium text-foreground">Couldn't load this order</p>
            <p className="max-w-xs text-sm text-muted">
              It may not exist, or something went wrong while fetching it.
            </p>
            <Button variant="outline" size="sm" onClick={() => orderQuery.refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : order ? (
          <>
            <div className="rounded-lg border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted">{order.id}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                      {order.courierId ? "Reassign courier" : "Assign courier"}
                    </Button>
                    {canCancel(order.status) ? (
                      <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
                        <XCircle className="h-4 w-4" />
                        Cancel order
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {canManage ? (
                <div className="mt-4">
                  <UpdateStatusControl orderId={order.id} currentStatus={order.status} />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold text-foreground">Delivery information</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Customer</dt>
                    <dd className="text-foreground">{order.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Pickup address</dt>
                    <dd className="text-foreground">{order.pickupAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Drop-off address</dt>
                    <dd className="text-foreground">{order.dropoffAddress}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold text-foreground">Package &amp; assignment</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Package weight</dt>
                    <dd className="text-foreground">{order.packageWeight}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Assigned courier</dt>
                    <dd className="text-foreground">
                      {order.courierId ? courierNames.get(order.courierId) ?? "Assigned" : "Unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Created</dt>
                    <dd className="text-foreground">{new Date(order.createdAt).toLocaleString()}</dd>
                  </div>
                  {order.cancelledAt ? (
                    <div>
                      <dt className="text-xs text-muted">Cancelled</dt>
                      <dd className="text-foreground">{new Date(order.cancelledAt).toLocaleString()}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Status history</h2>
              <OrderStatusTimeline history={order.statusHistory} changedByNames={courierNames} />
            </div>

            {canManage ? (
              <>
                <AssignCourierDialog
                  orderId={order.id}
                  currentCourierId={order.courierId}
                  open={assignOpen}
                  onOpenChange={setAssignOpen}
                />
                <CancelOrderDialog orderId={order.id} open={cancelOpen} onOpenChange={setCancelOpen} />
              </>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            Order not found. <Link to="/orders" className="text-primary hover:underline">Back to Orders</Link>
          </p>
        )}
      </div>
    </AppShell>
  );
}
