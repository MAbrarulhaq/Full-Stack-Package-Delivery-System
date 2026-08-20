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

// Fields supplied when creating an order.
// Status is excluded; the database defaults it to `pending`.

export type CreateOrderInput = Omit<
  NewOrder,
  "id" | "status" | "cancelledAt" | "createdAt" | "updatedAt"
>;

// Data access for the `orders` table.
// Accepts either the shared db client or an active transaction.
// No transactions or business rules are handled here.
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

  // Pure write: updates the order status.
// Transition validation is handled by the service layer.

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

  // Pure write: marks the order as cancelled and sets `cancelledAt`.
// Cancellation rules are handled by the service layer.
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

  async countByCourierId(dbClient: DbClient, courierId: string): Promise<number> {
    const [row] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.courierId, courierId));

    return row?.count ?? 0;
  },

 // Pure write: assigns or unassigns a courier.
// Courier validation is handled by the service layer.
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
