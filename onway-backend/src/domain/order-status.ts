// Order lifecycle state machine. Defines the only allowed status transitions.
// No Drizzle, DB, or Hono dependencies; transition rules stay in the domain layer.

export const ORDER_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["delivered", "cancelled"];

// Maps each status to its allowed next states. Terminal states have no transitions.
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// Returns all statuses the current state may transition to.
export function getAllowedTransitions(current: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[current];
}

// Checks whether a status transition is valid.
export function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
  return TRANSITIONS[current].includes(next);
}

// Checks whether the status is terminal.
export function isTerminalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}