/**
 * The order lifecycle state machine. This is the single source of truth
 * for which status transitions are allowed — the service layer calls
 * into this module rather than re-implementing the rules, and nothing
 * outside `src/domain/` should hand-roll a transition check.
 *
 * Deliberately has ZERO imports from Drizzle, the db schema, or Hono.
 * The status literals below are duplicated from the `order_status`
 * Postgres enum (see src/db/schema/enums.ts) by design, not by accident:
 * the DB enum is the source of truth for what can be *persisted*, this
 * module is the source of truth for what transition is *allowed*. Both
 * lists must be kept in sync if a status is ever added or removed — that
 * coupling is inherent to the domain and is intentionally visible rather
 * than hidden behind a cross-layer import.
 */

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

/**
 * Adjacency list of the state machine. Every status maps to the list of
 * statuses it may legally transition into. Terminal states map to an
 * empty array.
 */
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/** All statuses `current` may legally move to next. Empty for terminal states. */
export function getAllowedTransitions(current: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[current];
}

/** Whether `current -> next` is a legal transition in the state machine. */
export function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
  return TRANSITIONS[current].includes(next);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
