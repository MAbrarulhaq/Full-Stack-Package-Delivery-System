import { NotFoundError, ConflictError } from "./app-error";
import type { OrderStatus } from "../domain/order-status";

export class OrderNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Order ${id} not found`, "ORDER_NOT_FOUND");
  }
}

/**
 * Thrown when the domain state machine (src/domain/order-status.ts)
 * rejects a requested transition. The service layer is the only caller —
 * see order.service.ts.
 */
export class InvalidTransitionError extends ConflictError {
  constructor(current: OrderStatus, next: OrderStatus) {
    super(
      `Cannot transition order from '${current}' to '${next}'`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

/** More specific message than a generic InvalidTransitionError for the common "already delivered" cancel attempt. */
export class OrderAlreadyDeliveredError extends ConflictError {
  constructor(id: string) {
    super(
      `Order ${id} has already been delivered and cannot be cancelled`,
      "ORDER_ALREADY_DELIVERED",
    );
  }
}

/** More specific message for cancelling an order that's already cancelled. */
export class OrderAlreadyCancelledError extends ConflictError {
  constructor(id: string) {
    super(`Order ${id} is already cancelled`, "ORDER_ALREADY_CANCELLED");
  }
}
