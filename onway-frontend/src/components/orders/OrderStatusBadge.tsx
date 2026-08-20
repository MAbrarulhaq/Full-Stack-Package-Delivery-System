import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";


 //Never relies on color alone: every badge shows a text label plus a
 // small dot, so status is legible without color perception.
 
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const style = ORDER_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
