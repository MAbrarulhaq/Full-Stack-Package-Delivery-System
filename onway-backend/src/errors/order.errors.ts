import { NotFoundError, ConflictError } from "./app-error";
import type { OrderStatus } from "../domain/order-status";

export class OrderNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Order ${id} not found`, "ORDER_NOT_FOUND");
  }
}

// Thrown when the requested status transition is not allowed.
export class InvalidTransitionError extends ConflictError {
  constructor(current: OrderStatus, next: OrderStatus) {
    super(
      `Cannot transition order from '${current}' to '${next}'`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

// Thrown when trying to cancel an order that is already delivered.
export class OrderAlreadyDeliveredError extends ConflictError {
  constructor(id: string) {
    super(
      `Order ${id} has already been delivered and cannot be cancelled`,
      "ORDER_ALREADY_DELIVERED",
    );
  }
}

// Thrown when trying to cancel an order that is already cancelled.
export class OrderAlreadyCancelledError extends ConflictError {
  constructor(id: string) {
    super(`Order ${id} is already cancelled`, "ORDER_ALREADY_CANCELLED");
  }
}