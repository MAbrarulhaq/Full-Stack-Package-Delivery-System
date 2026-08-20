import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { Pagination } from "@/components/orders/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { getOrders, getMyOrders } from "@/api/orders";
import { getCouriers } from "@/api/users";
import type { OrderStatus } from "@/types/order";


export function Orders() {
  const { user } = useAuth();
  const isCourier = user?.role === "courier";
  const canManage = user?.role === "admin" || user?.role === "staff";

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const ordersQuery = useQuery({
    queryKey: isCourier
      ? (["orders", "my", { page, limit }] as const)
      : (["orders", { page, limit, status }] as const),
    queryFn: () =>
      isCourier
        ? getMyOrders({ page, limit })
        : getOrders({ page, limit, status: status || undefined }),
  });


  const couriersQuery = useQuery({
    queryKey: ["couriers"],
    queryFn: getCouriers,
    enabled: canManage,
  });

  const courierNames = useMemo(() => {
    if (!couriersQuery.data) return undefined;
    return new Map(couriersQuery.data.map((c) => [c.id, c.name]));
  }, [couriersQuery.data]);

  function handleStatusChange(next: OrderStatus | "") {
    setStatus(next);
    setPage(1);
  }

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  return (
    <AppShell
      title="Orders"
      description={isCourier ? "Your assigned deliveries" : "Manage delivery orders across the fleet"}
      actions={
        canManage ? (
          <Button asChild size="sm">
            <Link to="/orders/new">
              <Plus className="h-4 w-4" />
              Create Order
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <OrderFilters
          status={status}
          onStatusChange={handleStatusChange}
          limit={limit}
          onLimitChange={handleLimitChange}
          hideStatus={isCourier}
        />

        <OrdersTable
          orders={ordersQuery.data?.data}
          isLoading={ordersQuery.isLoading}
          isError={ordersQuery.isError}
          onRetry={() => ordersQuery.refetch()}
          courierNames={canManage ? courierNames : undefined}
          canCreate={canManage}
        />

        {ordersQuery.data ? (
          <Pagination pagination={ordersQuery.data.pagination} onPageChange={setPage} />
        ) : null}
      </div>
    </AppShell>
  );
}
