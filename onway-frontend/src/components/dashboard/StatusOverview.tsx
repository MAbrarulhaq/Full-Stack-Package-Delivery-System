import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";

interface StatusOverviewProps {
  counts: Record<OrderStatus, number>;
  total: number;
  isLoading: boolean;
}


 // A plain distribution list, not a chart library -- each bar's width is
 // `count / total` of the real backend counts, nothing decorative.
 
export function StatusOverview({ counts, total, isLoading }: StatusOverviewProps) {
  return (
    <div className="space-y-3">
      {ORDER_STATUSES.map((status) => {
        const count = counts[status] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const style = ORDER_STATUS_STYLES[status];

        return (
          <div key={status} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-sm text-foreground">{ORDER_STATUS_LABELS[status]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
              {isLoading ? null : (
                <div
                  className={`h-full rounded-full ${style.dot}`}
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted">{count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
