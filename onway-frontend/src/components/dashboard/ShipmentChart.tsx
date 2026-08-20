import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ShipmentChartProps {
  counts: Record<OrderStatus, number>;
  total: number;
  isLoading: boolean;
}

/**
 * Pure CSS/SVG bar chart visualizing order statuses.
 * Matches the reference design's "Shipments Statistics" section.
 */
export function ShipmentChart({ counts, total: _total, isLoading }: ShipmentChartProps) {
  // We only show a subset of statuses in the chart for clarity, just like the reference
  const chartStatuses: OrderStatus[] = [
    "pending",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  // Find the max value to scale the bars correctly
  const maxCount = Math.max(1, ...chartStatuses.map((s) => counts[s] ?? 0));

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Shipment Statistics</h2>
          <p className="mt-1 text-xs text-muted-foreground">Order status distribution</p>
        </div>
        <div className="flex items-center gap-3 rounded-md bg-background px-3 py-1.5 text-xs font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-800" />
            Orders
          </span>
        </div>
      </div>

      <div className="relative mt-auto flex h-[200px] items-end justify-between gap-2 sm:gap-4">
        {/* Y-axis grid lines (pure CSS) */}
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right text-[10px] font-medium text-muted-foreground/70">
                {pct}%
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 ml-11 flex h-full flex-1 items-end justify-between pt-5 pb-5">
          {chartStatuses.map((status) => {
            const count = counts[status] ?? 0;
            // Height is percentage of the maximum value to ensure chart looks good
            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const style = ORDER_STATUS_STYLES[status];

            return (
              <div key={status} className="group relative flex h-full w-full max-w-[40px] flex-col justify-end">
                {isLoading ? (
                  <Skeleton className="w-full rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ) : (
                  <div
                    className={cn("w-full rounded-t-sm transition-all duration-500 hover:opacity-80", style.bg.replace("-bg", ""), "bg-slate-800")}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                      {count}
                    </div>
                  </div>
                )}
                {/* X-axis label */}
                <div className="absolute -bottom-5 left-1/2 w-20 -translate-x-1/2 text-center text-[10px] font-medium text-muted-foreground">
                  {ORDER_STATUS_LABELS[status].split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
