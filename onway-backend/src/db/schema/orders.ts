import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./enums";
import { users } from "./users";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    customerName: text("customer_name").notNull(),
    pickupAddress: text("pickup_address").notNull(),
    dropoffAddress: text("dropoff_address").notNull(),
    // numeric, not float, for exact weight values; scale of 2 (e.g. 12.50 kg).
    packageWeight: numeric("package_weight", {
      precision: 8,
      scale: 2,
    }).notNull(),
    // Denormalized "current state" cache — always written in the same
    // transaction as the corresponding order_status_history row, so it
    // can never drift from the log. See blueprint §Q tradeoff #5.
    status: orderStatusEnum("status").notNull().default("pending"),
    courierId: uuid("courier_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Soft-delete / cancellation marker. NULL = active. Not-NULL = cancelled.
    // No separate `deleted_at` — see blueprint §20/§Q tradeoff #7.
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("package_weight_positive", sql`${table.packageWeight} > 0`),

    // Powers GET /orders?status=x alone.
    index("orders_status_idx").on(table.status),

    // Powers the default GET /orders sort/pagination.
    index("orders_created_at_idx").on(table.createdAt.desc()),

    // Composite: powers GET /orders?status=x&page=n (filter + paginate)
    // in a single index scan instead of two.
    index("orders_status_created_at_idx").on(
      table.status,
      table.createdAt.desc(),
    ),

    // Powers "my assigned orders" for the courier bonus.
    index("orders_courier_id_idx").on(table.courierId),
  ],
);
