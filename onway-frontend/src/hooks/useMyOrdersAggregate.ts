import { useQuery } from "@tanstack/react-query";
import { getAllMyOrders } from "@/api/orders";

 //Full aggregate of the authenticated courier's assigned orders, walking every page (see getAllMyOrders).
export function useMyOrdersAggregate() {
  return useQuery({
    queryKey: ["orders", "my", "all"] as const,
    queryFn: getAllMyOrders,
  });
}
