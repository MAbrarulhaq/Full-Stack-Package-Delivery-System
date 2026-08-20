import { sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./enums";
import { orders } from "./orders";
import { users } from "./users";

// Append-only audit trail. Rows are never updated or deleted.
// Every transition inserts a row in the same transaction as the order update.
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    // Nullable for system-generated rows; set from the authenticated user.
    changedBy: uuid("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    // Timestamp required by the assessment.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for GET /orders/:id history queries.
    index("order_status_history_order_id_created_at_idx").on(
      table.orderId,
      table.createdAt,
    ),
  ],
);