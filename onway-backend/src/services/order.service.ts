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
  /**
   * Creates the order AND its initial `pending` history row in one
   * transaction. `status` is never accepted from the caller — it's
   * always `pending`, enforced here (the repository doesn't even expose
   * a way to set it on create; see CreateOrderInput on the repository).
   *
   * `changedBy` is optional and defaults to null (kept for callers like
   * seed scripts that don't have an authenticated user). As of Step 4,
   * POST /orders requires auth, so the controller always passes the
   * creating staff member's id here — the initial history row is now
   * attributed, not just later transitions.
   */
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

  /**
   * Same lookup as getOrderById, plus a role-aware ownership check:
   * admin/staff can view any order; a courier can only view an order
   * where orders.courierId matches their own id. This is the fix for
   * the "any courier can read any order" gap — the route's requireRole
   * only proves the caller IS *a* courier, not that they own THIS order,
   * so the check has to happen here with the specific order in hand.
   *
   * Returns the same OrderNotFoundError for a missing order regardless
   * of role (no information leak about existence), and ForbiddenError
   * for an existing order that belongs to a different courier.
   */
  async getOrderByIdForUser(id: string, authUser: AuthUser): Promise<OrderWithHistory> {
    const order = await this.getOrderById(id);

    if (authUser.role === "courier" && order.courierId !== authUser.id) {
      throw new ForbiddenError("You do not have access to this order");
    }

    return order;
  },

  /**
   * Validates the transition against the domain state machine, then
   * updates `orders.status` and inserts the history row atomically.
   * `changedBy` is nullable — it stays null until JWT auth (a later
   * bonus step) supplies an authenticated user id.
   */
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

  /**
   * DELETE /orders/:id is a cancellation, never a physical delete. Reuses
   * the same domain transition check as updateOrderStatus (single source
   * of truth for "is X -> cancelled allowed"), then maps a rejected
   * transition to the more specific error the caller already knows about
   * (already delivered / already cancelled) for a clearer API response.
   */
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

  /**
   * Courier assignment. Validates the target id refers to a real user
   * with role='courier' BEFORE writing — a non-existent id or a
   * staff/admin id is rejected with a specific typed error rather than
   * silently succeeding or failing a foreign-key constraint with a raw
   * DB error. Never touches `status` (explicit requirement) — only
   * `courierId`/`updatedAt`. Reassignment is explicitly allowed: this
   * method doesn't check whether the order already has a different
   * courier, since nothing in the spec restricts reassignment.
   */
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

  /**
   * Courier's own order list, in the same { data, pagination } shape as
   * listOrders() for a consistent API response style. `courierId` must
   * come from the authenticated JWT user (see order.controller.ts) —
   * this method has no way to distinguish "my orders" from "anyone's
   * orders" on its own, so the controller/route boundary is what
   * actually enforces "you can only see your own".
   */
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
