import { db } from "../db/index";
import { orderRepository } from "../repositories/order.repository";
import { orderStatusHistoryRepository } from "../repositories/order-status-history.repository";
import { userRepository } from "../repositories/user.repository";
import type { Order, OrderWithHistory } from "../repositories/order.repository";
import { isValidTransition, type OrderStatus } from "../domain/order-status";
import type { AuthUser } from "../utils/jwt";
import {
  OrderNotFoundError,
  InvalidTransitionError,
  OrderAlreadyDeliveredError,
  OrderAlreadyCancelledError,
  ForbiddenError,
  CourierNotFoundError,
  UserNotCourierError,
} from "../errors/index";

export interface CreateOrderInput {
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageWeight: number;
}

export interface ListOrdersInput {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface ListOrdersResult {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export const orderService = {
 // Creates the order and its initial pending history in one transaction.
// The status always starts as `pending`; `changedBy` records who created it.
  async createOrder(input: CreateOrderInput, changedBy: string | null = null): Promise<Order> {
    return db.transaction(async (tx) => {
      const order = await orderRepository.createOrder(tx, {
        customerName: input.customerName,
        pickupAddress: input.pickupAddress,
        dropoffAddress: input.dropoffAddress,
        // numeric columns are typed as `string` for insert (see Step 3 note)
        packageWeight: input.packageWeight.toFixed(2),
      });

      await orderStatusHistoryRepository.create(tx, {
        orderId: order.id,
        status: "pending",
        changedBy,
      });

      return order;
    });
  },

  async listOrders(input: ListOrdersInput): Promise<ListOrdersResult> {
    const { page, limit, status } = input;

    const [data, total] = await Promise.all([
      orderRepository.list(db, { page, limit, status }),
      orderRepository.count(db, { status }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getOrderById(id: string): Promise<OrderWithHistory> {
    const order = await orderRepository.findByIdWithHistory(db, id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  },
// Gets an order and checks courier ownership.
// Admin/staff can view any order; couriers can only view assigned orders.
// Missing orders return the same error for every role.
  async getOrderByIdForUser(id: string, authUser: AuthUser): Promise<OrderWithHistory> {
    const order = await this.getOrderById(id);

    if (authUser.role === "courier" && order.courierId !== authUser.id) {
      throw new ForbiddenError("You do not have access to this order");
    }

    return order;
  },

 // Validates the status transition, updates the order, and records the change
// in history within the same transaction.
  async updateOrderStatus(
    id: string,
    next: OrderStatus,
    changedBy: string | null = null,
  ): Promise<Order> {
    return db.transaction(async (tx) => {
      const order = await orderRepository.findById(tx, id);
      if (!order) {
        throw new OrderNotFoundError(id);
      }

      const current = order.status as OrderStatus;
      if (!isValidTransition(current, next)) {
        throw new InvalidTransitionError(current, next);
      }

      const updated = await orderRepository.updateStatus(tx, id, next);
      await orderStatusHistoryRepository.create(tx, {
        orderId: id,
        status: next,
        changedBy,
      });

      // updated is guaranteed defined: we just confirmed the row exists
      // inside this same transaction, and updateStatus() only returns
      // undefined when no row matched the WHERE clause.
      return updated as Order;
    });
  },

  // DELETE is a cancellation, not a physical delete.
// Uses the same transition rules and returns specific cancellation errors.
  async cancelOrder(id: string, changedBy: string | null = null): Promise<Order> {
    return db.transaction(async (tx) => {
      const order = await orderRepository.findById(tx, id);
      if (!order) {
        throw new OrderNotFoundError(id);
      }

      const current = order.status as OrderStatus;
      if (!isValidTransition(current, "cancelled")) {
        if (current === "delivered") {
          throw new OrderAlreadyDeliveredError(id);
        }
        if (current === "cancelled") {
          throw new OrderAlreadyCancelledError(id);
        }
        // Defensive fallback — every non-terminal status can currently
        // cancel, so this only triggers if the state machine changes.
        throw new InvalidTransitionError(current, "cancelled");
      }

      const cancelled = await orderRepository.cancel(tx, id);
      await orderStatusHistoryRepository.create(tx, {
        orderId: id,
        status: "cancelled",
        changedBy,
      });

      return cancelled as Order;
    });
  },

 // Validates that the target user exists and has the courier role.
// Assigns or reassigns the courier without changing the order status.
  async assignCourier(orderId: string, courierId: string): Promise<Order> {
    const order = await orderRepository.findById(db, orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const courier = await userRepository.findById(db, courierId);
    if (!courier) {
      throw new CourierNotFoundError(courierId);
    }
    if (courier.role !== "courier") {
      throw new UserNotCourierError(courierId);
    }

    const updated = await orderRepository.assignCourier(db, orderId, courierId);
    // updated is guaranteed defined: we just confirmed the order exists above.
    return updated as Order;
  },

  // Returns the authenticated courier's assigned orders with pagination.
// The courier ID comes from the JWT, not the request.
  async getOrdersByCourier(
    courierId: string,
    params: PaginationInput,
  ): Promise<ListOrdersResult> {
    const [data, total] = await Promise.all([
      orderRepository.findByCourierId(db, courierId, params),
      orderRepository.countByCourierId(db, courierId),
    ]);

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  },
};
