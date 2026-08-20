import { useMemo } from "react";
import { Package, Clock, Boxes, Truck, Navigation, CheckCircle2, TriangleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./KpiCard";
import { ActiveDeliveries } from "./ActiveDeliveries";
import { useMyOrdersAggregate } from "@/hooks/useMyOrdersAggregate";
import { useAuth } from "@/hooks/useAuth";
import { isTerminalStatus } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function CourierDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyOrdersAggregate();

  const counts = useMemo(() => {
    const base: Record<OrderStatus, number> = {
      pending: 0,
      picked_up: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    data?.orders.forEach((o) => {
      base[o.status] += 1;
    });
    return base;
  }, [data]);

  const activeOrders = useMemo(
    () => (data?.orders ?? []).filter((o) => !isTerminalStatus(o.status)),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Hello {user?.name ? user.name.split(' ')[0] : 'there'},
          <br />
          {greeting()}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">My assigned deliveries at a glance.</p>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <TriangleAlert className="h-7 w-7 text-status-cancelled" />
          <p className="text-sm font-medium text-foreground">Couldn't load your deliveries</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Total Assigned" value={data?.total ?? 0} icon={Package} isLoading={isLoading} />
            <KpiCard
              label="Pending"
              value={counts.pending}
              icon={Clock}
              isLoading={isLoading}
              accentClassName="text-status-pending"
            />
            <KpiCard
              label="Picked Up"
              value={counts.picked_up}
              icon={Boxes}
              isLoading={isLoading}
              accentClassName="text-status-picked-up"
            />
            <KpiCard
              label="In Transit"
              value={counts.in_transit}
              icon={Truck}
              isLoading={isLoading}
              accentClassName="text-status-in-transit"
            />
            <KpiCard
              label="Out for Delivery"
              value={counts.out_for_delivery}
              icon={Navigation}
              isLoading={isLoading}
              accentClassName="text-status-out-for-delivery"
            />
            <KpiCard
              label="Delivered"
              value={counts.delivered}
              icon={CheckCircle2}
              isLoading={isLoading}
              accentClassName="text-status-delivered"
            />
          </div>

          {data && !data.complete ? (
            <p className="text-xs text-muted">
              Showing stats for your most recent {data.orders.length} of {data.total} assigned orders.
            </p>
          ) : null}

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Active Deliveries</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[4.5rem] animate-pulse rounded-lg border border-border bg-surface" />
                ))}
              </div>
            ) : (
              <ActiveDeliveries orders={activeOrders} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
