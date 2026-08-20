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
    // Numeric for exact weight values, with 2 decimal places.
    packageWeight: numeric("package_weight", {
      precision: 8,
      scale: 2,
    }).notNull(),
    // Current status, kept in sync with the history table.
    status: orderStatusEnum("status").notNull().default("pending"),
    courierId: uuid("courier_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // NULL = active; non-NULL = cancelled.
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

    // Index for filtering by status.
    index("orders_status_idx").on(table.status),

    // Index for default sorting and pagination.
    index("orders_created_at_idx").on(table.createdAt.desc()),

    // Composite index for status filtering and pagination.
    index("orders_status_created_at_idx").on(
      table.status,
      table.createdAt.desc(),
    ),

    // Index for courier-assigned orders.
    index("orders_courier_id_idx").on(table.courierId),
  ],
);