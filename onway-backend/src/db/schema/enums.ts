import { pgEnum } from "drizzle-orm/pg-core";

// Fixed delivery lifecycle. `delivered` and `cancelled` are terminal.
// Transition rules are enforced in the service layer.
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

// `admin` and `staff` can update order status; `courier` is read-only.
// Permissions are enforced in middleware, not the DB.
export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "courier"]);