import { relations } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";
import { orderStatusHistory } from "./order-status-history";

export const usersRelations = relations(users, ({ many }) => ({
  // Orders this user is assigned to as a courier.
  assignedOrders: many(orders, { relationName: "courierOrders" }),
  // History rows this user authored (status changes they made as staff/admin).
  statusChanges: many(orderStatusHistory),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  courier: one(users, {
    fields: [orders.courierId],
    references: [users.id],
    relationName: "courierOrders",
  }),
  statusHistory: many(orderStatusHistory),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedByUser: one(users, {
      fields: [orderStatusHistory.changedBy],
      references: [users.id],
    }),
  }),
);
