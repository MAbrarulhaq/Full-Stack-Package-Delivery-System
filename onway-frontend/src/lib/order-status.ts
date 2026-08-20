import type { OrderStatus } from "@/types/order";


export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, { text: string; bg: string; dot: string }> = {
  pending: { text: "text-status-pending", bg: "bg-status-pending-bg", dot: "bg-status-pending" },
  picked_up: { text: "text-status-picked-up", bg: "bg-status-picked-up-bg", dot: "bg-status-picked-up" },
  in_transit: { text: "text-status-in-transit", bg: "bg-status-in-transit-bg", dot: "bg-status-in-transit" },
  out_for_delivery: {
    text: "text-status-out-for-delivery",
    bg: "bg-status-out-for-delivery-bg",
    dot: "bg-status-out-for-delivery",
  },
  delivered: { text: "text-status-delivered", bg: "bg-status-delivered-bg", dot: "bg-status-delivered" },
  cancelled: { text: "text-status-cancelled", bg: "bg-status-cancelled-bg", dot: "bg-status-cancelled" },
};


const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function getAllowedTransitions(current: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[current];
}

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["delivered", "cancelled"];

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canCancel(status: OrderStatus): boolean {
  return !isTerminalStatus(status);
}
