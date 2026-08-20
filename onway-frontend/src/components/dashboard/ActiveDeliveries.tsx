import { Link } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { Order } from "@/types/order";

export function ActiveDeliveries({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-14 text-center">
        <PackageCheck className="h-7 w-7 text-status-delivered" />
        <p className="text-sm font-medium text-foreground">You're all caught up</p>
        <p className="max-w-xs text-sm text-muted">No deliveries are currently assigned to you.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            to={`/orders/${order.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary">{order.id.slice(0, 8)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{order.customerName}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {order.pickupAddress} → {order.dropoffAddress}
              </p>
            </div>
            <div className="shrink-0 text-sm text-muted sm:text-right">{order.packageWeight}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
