import { useQueries, useQuery } from "@tanstack/react-query";
import { getOrders } from "@/api/orders";
import { getUsers } from "@/api/users";
import { ORDER_STATUSES } from "@/types/order";
import type { OrderStatus } from "@/types/order";
import { USER_ROLES } from "@/types/user";
import type { UserRole } from "@/types/auth";


 //Exact per-status totals for the whole order book, not just the
 //current page. Each request asks for limit=1 (we only need
 // `pagination.total`, not the rows) so this is 7 cheap requests, not 7
 //full list fetches. `pagination.total` is the backend's own count of
 // every matching row -- never the length of `data`.
 
export function useOrderStatusCounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["orders", "count", "all"] as const,
        queryFn: () => getOrders({ page: 1, limit: 1 }),
      },
      ...ORDER_STATUSES.map((status) => ({
        queryKey: ["orders", "count", status] as const,
        queryFn: () => getOrders({ page: 1, limit: 1, status }),
      })),
    ],
  });

  const [totalResult, ...statusResults] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  const counts: Record<OrderStatus, number> = ORDER_STATUSES.reduce(
    (acc, status, i) => {
      acc[status] = statusResults[i].data?.pagination.total ?? 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  return {
    total: totalResult.data?.pagination.total ?? 0,
    counts,
    isLoading,
    isError,
    refetch: () => results.forEach((r) => r.refetch()),
  };
}

// Most recent orders for the "Recent Orders" section -- GET /orders is already sorted createdAt desc, so page 1 is the latest N.
export function useRecentOrders(limit = 8) {
  return useQuery({
    queryKey: ["orders", { page: 1, limit, status: undefined }] as const,
    queryFn: () => getOrders({ page: 1, limit }),
  });
}


 //Real per-role user counts, same cheap-limit=1-request pattern as
 //useOrderStatusCounts above -- only meaningful for an admin (GET /users
 // is admin-only on the backend), so this is only ever called from
 //within the admin branch of the dashboard.
 
export function useUserCounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["users", "count", "all"] as const,
        queryFn: () => getUsers({ page: 1, limit: 1 }),
      },
      ...USER_ROLES.map((role) => ({
        queryKey: ["users", "count", role] as const,
        queryFn: () => getUsers({ page: 1, limit: 1, role }),
      })),
    ],
  });

  const [totalResult, ...roleResults] = results;
  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  const counts: Record<UserRole, number> = USER_ROLES.reduce(
    (acc, role, i) => {
      acc[role] = roleResults[i].data?.pagination.total ?? 0;
      return acc;
    },
    {} as Record<UserRole, number>,
  );

  return {
    total: totalResult.data?.pagination.total ?? 0,
    counts,
    isLoading,
    isError,
  };
}
