import { asc, eq } from "drizzle-orm";
import type { DbClient } from "../db/index";
import { orderStatusHistory } from "../db/schema/index";

export type OrderStatusHistoryEntry = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistoryEntry = typeof orderStatusHistory.$inferInsert;

// Data access for the append-only order status history.
// Only inserts are supported; rows are never updated or deleted.
// create() should use the same transaction as the order status update.
export const orderStatusHistoryRepository = {
  async create(
    dbClient: DbClient,
    data: NewOrderStatusHistoryEntry,
  ): Promise<OrderStatusHistoryEntry> {
    const [entry] = await dbClient
      .insert(orderStatusHistory)
      .values(data)
      .returning();

    if (!entry) {
      throw new Error("Insert into order_status_history returned no row.");
    }
    return entry;
  },

  async findByOrderId(
    dbClient: DbClient,
    orderId: string,
  ): Promise<OrderStatusHistoryEntry[]> {
    return dbClient
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.createdAt));
  },
};
