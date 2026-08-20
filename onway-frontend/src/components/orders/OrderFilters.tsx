import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ORDER_STATUSES, type OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

interface OrderFiltersProps {
  status: OrderStatus | "";
  onStatusChange: (status: OrderStatus | "") => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  // GET /orders/my has no status query param (see orders.routes.ts), 
  // so a courier's view hides this control rather than offering a filter the backend ignores. 
  hideStatus?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];


 //Real server-side filtering only -- both fields feed straight into the
 // GET /orders query params (see Orders.tsx), never client-side filtering
// over an already-fetched page.

export function OrderFilters({ status, onStatusChange, limit, onLimitChange, hideStatus }: OrderFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {!hideStatus ? (
        <div className="w-44 space-y-1.5">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            id="status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus | "")}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="w-32 space-y-1.5">
        <Label htmlFor="page-size">Per page</Label>
        <Select
          id="page-size"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
