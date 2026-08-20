import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import type { OrderStatusHistoryEntry } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  history: OrderStatusHistoryEntry[];
   //Maps a user id -> display name, for the "changed by" line. 
   //Falls back to "System" when null (see order-status-history schema: changedBy is nullable). 
  changedByNames?: Map<string, string>;
}

export function OrderStatusTimeline({ history, changedByNames }: OrderStatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted">No status history yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {history.map((entry, index) => {
        const style = ORDER_STATUS_STYLES[entry.status];
        const isLast = index === history.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[7px] top-4 h-full w-px bg-border"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={cn("relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface", style.dot)}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {ORDER_STATUS_LABELS[entry.status]}
              </p>
              <p className="text-xs text-muted">
                {entry.changedBy ? (changedByNames?.get(entry.changedBy) ?? "Staff") : "System"} ·{" "}
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
