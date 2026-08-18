import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Fixed delivery lifecycle. `delivered` and `cancelled` are terminal —
 * that rule is enforced in the service layer's transition map, not here;
 * this enum only guarantees the *value* is one of these six.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

/**
 * `admin` and `staff` can update order status; `courier` is read-only
 * (sees assigned orders). Enforced in middleware, not the DB.
 */
export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "courier"]);
