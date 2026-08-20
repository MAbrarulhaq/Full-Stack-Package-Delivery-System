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
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div key={order.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
          <Link
            to={`/orders/${order.id}`}
            className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between sm:mb-1 sm:justify-start sm:gap-3">
                <span className="font-mono text-xs font-semibold text-emerald-600">#{order.id.slice(0, 8)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-base font-semibold text-foreground">{order.customerName}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{order.pickupAddress}</span>
                <span className="shrink-0">→</span>
                <span className="truncate">{order.dropoffAddress}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-border pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight</span>
              <span className="text-sm font-semibold text-foreground">{order.packageWeight} kg</span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
