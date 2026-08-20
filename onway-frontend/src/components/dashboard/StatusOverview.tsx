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
  // Calculate percentage for the donut chart based on delivered orders (or another metric)
  const deliveredPct = total > 0 ? Math.round(((counts.delivered ?? 0) / total) * 100) : 0;
  
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Analytic view</h2>
          <p className="mt-1 text-xs text-muted-foreground">Total order fulfillment overview</p>
        </div>
      </div>

      {/* Donut Chart / Semi-circle representation */}
      <div className="relative mx-auto mb-8 flex h-32 w-64 items-end justify-center overflow-hidden">
        {isLoading ? (
          <Skeleton className="absolute top-0 h-64 w-64 rounded-full" />
        ) : (
          <>
            <div className="absolute top-0 h-64 w-64 rounded-full border-[1.5rem] border-slate-100" />
            <div 
              className="absolute top-0 h-64 w-64 rounded-full border-[1.5rem] border-emerald-500 border-b-transparent border-r-transparent transition-transform duration-1000 ease-in-out" 
              style={{ transform: `rotate(${-135 + (deliveredPct * 1.8)}deg)` }}
            />
            <div className="flex flex-col items-center pb-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">{total.toLocaleString()}</span>
              <span className="mt-1 text-xs font-medium text-emerald-500">
                {deliveredPct}% Delivered
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto space-y-3.5">
        {ORDER_STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const style = ORDER_STATUS_STYLES[status];

          return (
            <div key={status} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm font-medium text-foreground">{ORDER_STATUS_LABELS[status]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
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
                <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
