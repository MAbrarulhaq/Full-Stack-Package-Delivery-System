import type { Context } from "hono";
import { orderService } from "../services/order.service";
import type {
  CreateOrderBody,
  ListOrdersQuery,
  UpdateOrderStatusBody,
  AssignCourierBody,
} from "../validators/order.validator";
import type { IdParam } from "../validators/common.validator";
import type { PaginationQuery } from "../validators/common.validator";
import { getAuthUser } from "../middleware/auth";


 //Thin controllers: extract validated data, call one service method,
 // and shape the HTTP response. No business logic, Drizzle access, or
 // transaction management—those belong in order.service.ts.
  // All routes require jwtAuth(), so getAuthUser(c) is safe to use.
 
export const orderController = {
  async create(c: Context) {
    const body = c.req.valid("json" as never) as CreateOrderBody;
    const authUser = getAuthUser(c);
    const order = await orderService.createOrder(body, authUser.id);
    return c.json({ success: true, data: order }, 201);
  },

  async list(c: Context) {
    const query = c.req.valid("query" as never) as ListOrdersQuery;
    const result = await orderService.listOrders(query);
    return c.json({ success: true, ...result }, 200);
  },

  async getById(c: Context) {
    const { id } = c.req.valid("param" as never) as IdParam;
    const authUser = getAuthUser(c);
    // Ownership check (admin/staff: any order; courier: only their own)
    // lives in the service, not here -- see getOrderByIdForUser's docstring.
    const order = await orderService.getOrderByIdForUser(id, authUser);
    return c.json({ success: true, data: order }, 200);
  },

  async assign(c: Context) {
    const { id } = c.req.valid("param" as never) as IdParam;
    const { courierId } = c.req.valid("json" as never) as AssignCourierBody;
    const order = await orderService.assignCourier(id, courierId);
    return c.json({ success: true, data: order }, 200);
  },

  // GET /orders/my -- courierId is taken from the JWT, never from client input. 
  async myOrders(c: Context) {
    const { page, limit } = c.req.valid("query" as never) as PaginationQuery;
    const authUser = getAuthUser(c);
    const result = await orderService.getOrdersByCourier(authUser.id, { page, limit });
    return c.json({ success: true, ...result }, 200);
  },

  async updateStatus(c: Context) {
    const { id } = c.req.valid("param" as never) as IdParam;
    const { status } = c.req.valid("json" as never) as UpdateOrderStatusBody;
    const authUser = getAuthUser(c);
    const order = await orderService.updateOrderStatus(id, status, authUser.id);
    return c.json({ success: true, data: order }, 200);
  },

  async cancel(c: Context) {
    const { id } = c.req.valid("param" as never) as IdParam;
    const authUser = getAuthUser(c);
    const order = await orderService.cancelOrder(id, authUser.id);
    return c.json({ success: true, data: order }, 200);
  },
};
