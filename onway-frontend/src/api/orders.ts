import { apiRequest } from "./client";
import type { ApiSuccessEnvelope } from "./client";
import type {
  CreateOrderPayload,
  ListOrdersParams,
  ListOrdersResult,
  Order,
  OrderStatus,
  OrderWithHistory,
  PaginationInput,
} from "@/types/order";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}


 //GET /orders. The envelope for list endpoints carries `pagination`
 // alongside `data` (see ApiSuccessEnvelope's index signature), so the
 // whole envelope is fetched and reshaped into { data, pagination } here
 // rather than typed as ApiSuccessEnvelope<Order[]>.
 
export async function getOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
  const query = buildQuery({ page: params.page, limit: params.limit, status: params.status });
  const res = await apiRequest<ListOrdersResult & { success: true }>(`/orders${query}`);
  return { data: res.data, pagination: res.pagination };
}

// GET /orders/my -- courier's own assigned orders. No status filter param on this endpoint (see orders.routes.ts). 
export async function getMyOrders(params: PaginationInput): Promise<ListOrdersResult> {
  const query = buildQuery({ page: params.page, limit: params.limit });
  const res = await apiRequest<ListOrdersResult & { success: true }>(`/orders/my${query}`);
  return { data: res.data, pagination: res.pagination };
}

// Fetches every page of the caller's assigned orders (GET /orders/my has no status filter, 
 // so full aggregation requires walking pagination).
 //  Capped at MAX_PAGES as a sane safety limit
 // -- returns whether the walk was complete so callers can avoid presenting a partial aggregate as exact.
const MAX_PAGES = 10;

export async function getAllMyOrders(): Promise<{ orders: Order[]; total: number; complete: boolean }> {
  const first = await getMyOrders({ page: 1, limit: 100 });
  const orders = [...first.data];
  const totalPages = Math.min(first.pagination.totalPages, MAX_PAGES);

  for (let page = 2; page <= totalPages; page++) {
    const next = await getMyOrders({ page, limit: 100 });
    orders.push(...next.data);
  }

  return {
    orders,
    total: first.pagination.total,
    complete: first.pagination.totalPages <= MAX_PAGES,
  };
}

// GET /orders/:id -- full order including its status history. 
export async function getOrder(id: string): Promise<OrderWithHistory> {
  const res = await apiRequest<ApiSuccessEnvelope<OrderWithHistory>>(`/orders/${id}`);
  return res.data;
}

// POST /orders -- status is never sent; the backend always starts new orders at `pending`.
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await apiRequest<ApiSuccessEnvelope<Order>>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

// PATCH /orders/:id/status 
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await apiRequest<ApiSuccessEnvelope<Order>>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.data;
}

//PATCH /orders/:id/assign 
export async function assignCourier(id: string, courierId: string): Promise<Order> {
  const res = await apiRequest<ApiSuccessEnvelope<Order>>(`/orders/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ courierId }),
  });
  return res.data;
}

//DELETE /orders/:id -- soft cancellation (sets status='cancelled' + cancelledAt), never a hard delete. 
export async function cancelOrder(id: string): Promise<Order> {
  const res = await apiRequest<ApiSuccessEnvelope<Order>>(`/orders/${id}`, {
    method: "DELETE",
  });
  return res.data;
}
