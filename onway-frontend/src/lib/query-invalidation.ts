import type { QueryClient } from "@tanstack/react-query";


export function invalidateOrderQueries(queryClient: QueryClient, orderId?: string) {
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
  }
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "orders",
  });
}
