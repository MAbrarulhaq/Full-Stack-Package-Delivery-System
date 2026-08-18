import { asc, eq } from "drizzle-orm";
import type { DbClient } from "../db/index";
import { orderStatusHistory } from "../db/schema/index";

export type OrderStatusHistoryEntry = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistoryEntry = typeof orderStatusHistory.$inferInsert;

/**
 * Data access for the append-only `order_status_history` table. Rows are
 * only ever inserted, never updated or deleted by the application — there
 * is deliberately no `update`/`delete` method here.
 *
 * `create()` is designed to be called inside the same transaction as
 * `orderRepository.updateStatus()`/`cancel()` — pass the same `tx` to
 * both. This repository doesn't enforce that; the service layer does
 * (Step 4).
 */
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
