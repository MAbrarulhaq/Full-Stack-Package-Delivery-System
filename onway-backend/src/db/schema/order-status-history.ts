import { sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./enums";
import { orders } from "./orders";
import { users } from "./users";

/**
 * Append-only audit trail. Rows are never updated or deleted by the
 * application — every successful transition inserts a new row here in
 * the same transaction as the `orders.status` update (see blueprint §K).
 */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    // Nullable: NULL for system-generated rows (e.g. the initial `pending`
    // row created at POST /orders, before any staff action), populated
    // from the authenticated user once JWT auth is wired up.
    changedBy: uuid("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    // This is the "timestamp" field the assessment asks for.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Powers GET /orders/:id — full history for one order, in order.
    index("order_status_history_order_id_created_at_idx").on(
      table.orderId,
      table.createdAt,
    ),
  ],
);
