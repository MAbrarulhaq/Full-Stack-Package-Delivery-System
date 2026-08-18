import { desc, eq, sql } from "drizzle-orm";
import type { DbClient } from "../db/index";
import { orders, orderStatusHistory } from "../db/schema/index";
import type { orderStatusEnum } from "../db/schema/index";

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export type OrderWithHistory = Order & {
  statusHistory: (typeof orderStatusHistory.$inferSelect)[];
};

export interface ListOrdersParams {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Fields the caller supplies when creating an order. `status` is
 * deliberately NOT part of this type — the repository always inserts with
 * the column's DB default (`pending`). Whether/how a caller could ever
 * override that is a service-layer decision (see blueprint §M), not
 * something this repository exposes.
 */
export type CreateOrderInput = Omit<
  NewOrder,
  "id" | "status" | "cancelledAt" | "createdAt" | "updatedAt"
>;

/**
 * Data access for the `orders` table. Every method takes `dbClient` as its
 * first argument so callers (the service layer, from Step 4 onward) can
 * pass either the shared `db` instance or an active transaction (`tx`) —
 * this repository never decides which one to use, and never opens a
 * transaction itself.
 *
 * No method here validates a status transition or decides whether a
 * cancellation is allowed — that's business logic and belongs to the
 * service layer.
 */
export const orderRepository = {
  async createOrder(dbClient: DbClient, data: CreateOrderInput): Promise<Order> {
    const [order] = await dbClient.insert(orders).values(data).returning();
    if (!order) {
      throw new Error("Insert into orders returned no row.");
    }
    return order;
  },

  async findById(dbClient: DbClient, id: string): Promise<Order | undefined> {
    return dbClient.query.orders.findFirst({
      where: eq(orders.id, id),
    });
  },

  async findByIdWithHistory(
    dbClient: DbClient,
    id: string,
  ): Promise<OrderWithHistory | undefined> {
    return dbClient.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        statusHistory: {
          orderBy: (history, { asc }) => [asc(history.createdAt)],
        },
      },
    });
  },

  async list(dbClient: DbClient, params: ListOrdersParams): Promise<Order[]> {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    return dbClient
      .select()
      .from(orders)
      .where(status ? eq(orders.status, status) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async count(dbClient: DbClient, params: { status?: OrderStatus }): Promise<number> {
    const [row] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(params.status ? eq(orders.status, params.status) : undefined);

    return row?.count ?? 0;
  },

  /**
   * Pure write: sets `orders.status` to whatever is passed in. Does NOT
   * check whether the transition is valid — the service layer must decide
   * that before calling this.
   */
  async updateStatus(
    dbClient: DbClient,
    id: string,
    status: OrderStatus,
  ): Promise<Order | undefined> {
    const [order] = await dbClient
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return order;
  },

  /**
   * Pure write: sets status to `cancelled` and stamps `cancelledAt`. Does
   * NOT check whether cancellation is allowed (e.g. that the order isn't
   * already `delivered`) — that belongs to the service layer.
   */
  async cancel(dbClient: DbClient, id: string): Promise<Order | undefined> {
    const now = new Date();
    const [order] = await dbClient
      .update(orders)
      .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
      .where(eq(orders.id, id))
      .returning();

    return order;
  },

  async findByCourierId(
    dbClient: DbClient,
    courierId: string,
    params: PaginationParams,
  ): Promise<Order[]> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    return dbClient
      .select()
      .from(orders)
      .where(eq(orders.courierId, courierId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  },

  /** Matches the count()/list() pairing pattern above, scoped to one courier — used for GET /orders/my's pagination totals. */
  async countByCourierId(dbClient: DbClient, courierId: string): Promise<number> {
    const [row] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.courierId, courierId));

    return row?.count ?? 0;
  },

  /**
   * Pure write: sets `orders.courierId` to whatever is passed in (or
   * `null` to unassign). Does NOT verify the target id is a real user,
   * let alone one with role='courier' — that validation belongs to the
   * service layer (see orderService.assignCourier), which is why this
   * repository never imports the users table.
   */
  async assignCourier(
    dbClient: DbClient,
    id: string,
    courierId: string,
  ): Promise<Order | undefined> {
    const [order] = await dbClient
      .update(orders)
      .set({ courierId, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return order;
  },
};
