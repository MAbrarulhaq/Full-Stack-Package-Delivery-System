import { Link } from "react-router-dom";
import { ArrowRight, PackageX, TriangleAlert, RotateCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { Order } from "@/types/order";

interface RecentOrdersProps {
  orders: Order[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canCreate: boolean;
}

export function RecentOrders({ orders, isLoading, isError, onRetry, canCreate }: RecentOrdersProps) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/orders">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <TriangleAlert className="h-7 w-7 text-status-cancelled" />
          <p className="text-sm font-medium text-foreground">Couldn't load recent orders</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <PackageX className="h-7 w-7 text-muted" />
          <p className="text-sm font-medium text-foreground">No orders yet</p>
          {canCreate ? (
            <>
              <p className="max-w-xs text-sm text-muted">Create your first order to get started.</p>
              <Button asChild size="sm">
                <Link to="/orders/new">
                  <Plus className="h-4 w-4" />
                  Create your first order
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table rows */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th scope="col" className="px-6 py-2.5">Order ID</th>
                  <th scope="col" className="px-6 py-2.5">Customer</th>
                  <th scope="col" className="px-6 py-2.5">Pickup</th>
                  <th scope="col" className="px-6 py-2.5">Dropoff</th>
                  <th scope="col" className="px-6 py-2.5">Status</th>
                  <th scope="col" className="px-6 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-background/60">
                    <td className="px-6 py-3">
                      <Link to={`/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-foreground">{order.customerName}</td>
                    <td className="max-w-[10rem] truncate px-6 py-3 text-muted">{order.pickupAddress}</td>
                    <td className="max-w-[10rem] truncate px-6 py-3 text-muted">{order.dropoffAddress}</td>
                    <td className="px-6 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-muted">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards, no page-level horizontal scroll */}
          <ul className="divide-y divide-border sm:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="block px-4 py-3.5 transition-colors hover:bg-background/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-primary">{order.id.slice(0, 8)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{order.customerName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {order.pickupAddress} → {order.dropoffAddress}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
