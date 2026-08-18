import { NotFoundError, ConflictError } from "./app-error";

/** The courierId supplied to PATCH /orders/:id/assign doesn't match any user at all. */
export class CourierNotFoundError extends NotFoundError {
  constructor(courierId: string) {
    super(`Courier ${courierId} not found`, "COURIER_NOT_FOUND");
  }
}

/** The id supplied to PATCH /orders/:id/assign matches a real user, but that user's role isn't 'courier'. */
export class UserNotCourierError extends ConflictError {
  constructor(userId: string) {
    super(`User ${userId} does not have the courier role`, "USER_NOT_COURIER");
  }
}
