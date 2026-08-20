import { Link } from "react-router-dom";
import { PackageX, TriangleAlert, RotateCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { Order } from "@/types/order";

interface OrdersTableProps {
  orders: Order[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Maps courierId -> courier name. Omitted entirely (not just empty) when the viewer can't see courier data. */
  courierNames?: Map<string, string>;
  canCreate: boolean;
}

const COLUMN_COUNT = 6;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <PackageX className="h-8 w-8 text-muted" />
      <p className="text-sm font-medium text-foreground">No orders yet</p>
      <p className="max-w-xs text-sm text-muted">
        {canCreate
          ? "Create your first delivery order to see it appear here."
          : "No orders have been assigned to you yet."}
      </p>
      {canCreate ? (
        <Button asChild size="sm">
          <Link to="/orders/new">
            <Plus className="h-4 w-4" />
            Create Order
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-status-cancelled" />
      <p className="text-sm font-medium text-foreground">Couldn't load orders</p>
      <p className="max-w-xs text-sm text-muted">
        Something went wrong while fetching the orders list. Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

 //Desktop/tablet: a real table, horizontally scrollable only within its
 //own region if it ever needs to be (never the page). Mobile: a stacked
 //card list instead of shrinking the table -- same data, a layout that
 // actually fits 390px.
 
export function OrdersTable({ orders, isLoading, isError, onRetry, courierNames, canCreate }: OrdersTableProps) {
  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }

  if (!isLoading && (!orders || orders.length === 0)) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState canCreate={canCreate} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3">Order ID</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Weight</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Courier</th>
              <th scope="col" className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[10rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : orders!.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-background/60">
                    <td className="px-4 py-3.5">
                      <Link to={`/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{order.customerName}</td>
                    <td className="px-4 py-3.5 text-foreground">{order.packageWeight}</td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {order.courierId ? courierNames?.get(order.courierId) ?? "Assigned" : "Unassigned"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list, no page-level or table-level horizontal scroll */}
      <ul className="divide-y divide-border sm:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="space-y-2 px-4 py-3.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </li>
            ))
          : orders!.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/orders/${order.id}`}
                  className="block px-4 py-3.5 transition-colors hover:bg-background/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-primary">{order.id.slice(0, 8)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{order.customerName}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span>
                      {order.courierId ? courierNames?.get(order.courierId) ?? "Assigned" : "Unassigned"} · {order.packageWeight}
                    </span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}
