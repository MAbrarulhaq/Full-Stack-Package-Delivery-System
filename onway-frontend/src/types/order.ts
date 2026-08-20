import type { UserRole } from "./auth";

export const ORDER_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageWeight: string;
  status: OrderStatus;
  courierId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// One row from `order_status_history`, as returned nested under an order. 
export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedBy: string | null;
  createdAt: string;
}

// GET /orders/:id response `data` shape -- an order plus its full history, oldest first. 
export interface OrderWithHistory extends Order {
  statusHistory: OrderStatusHistoryEntry[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// GET /orders and GET /orders/my share this envelope shape (data + pagination alongside `success`). 
export interface ListOrdersResult {
  data: Order[];
  pagination: PaginationMeta;
}

export interface ListOrdersParams {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

// POST /orders body -- exactly the fields createOrderSchema (.strict()) accepts. No status, no courierId. 
export interface CreateOrderPayload {
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageWeight: number;
}

// A courier as returned by GET /users/couriers (SafeUser -- no passwordHash). 
export interface Courier {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
