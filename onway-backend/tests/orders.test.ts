import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { truncateAll, closeTestDb } from "./helpers/setup";
import { app, jsonBody, authHeader, registerAndLogin, createTestOrder } from "./helpers/fixtures";

describe("orders", () => {
  before(async () => {
    await truncateAll();
  });

  after(async () => {
    await closeTestDb();
  });

  describe("POST /orders", () => {
    it("creates an order as staff, starting at pending with an initial history row", async () => {
      const staff = await registerAndLogin("staff");

      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({
          customerName: "Bob",
          pickupAddress: "1 A St",
          dropoffAddress: "2 B St",
          packageWeight: 3.3,
        }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 201);
      assert.equal(body.data.status, "pending");
      assert.equal(body.data.courierId, null);

      const detailRes = await app.request(`/orders/${body.data.id}`, {
        headers: authHeader(staff.token),
      });
      const detailBody = await jsonBody(detailRes);
      assert.equal(detailBody.data.statusHistory.length, 1);
      assert.equal(detailBody.data.statusHistory[0].status, "pending");
      assert.equal(detailBody.data.statusHistory[0].changedBy, staff.id);
    });

    it("rejects a client-supplied status field (strict schema)", async () => {
      const staff = await registerAndLogin("staff");

      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({
          customerName: "X",
          pickupAddress: "A",
          dropoffAddress: "B",
          packageWeight: 1,
          status: "delivered",
        }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 400);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    it("rejects an unauthenticated request", async () => {
      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: "X",
          pickupAddress: "A",
          dropoffAddress: "B",
          packageWeight: 1,
        }),
      });
      assert.equal(res.status, 401);
    });

    it("rejects a courier attempting to create an order (403, not 401)", async () => {
      const courier = await registerAndLogin("courier");

      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(courier.token) },
        body: JSON.stringify({
          customerName: "X",
          pickupAddress: "A",
          dropoffAddress: "B",
          packageWeight: 1,
        }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });
  });

  describe("GET /orders", () => {
    it("lists orders with pagination", async () => {
      const staff = await registerAndLogin("staff");
      for (let i = 0; i < 3; i++) {
        await createTestOrder(staff.token, { customerName: `Page Customer ${i}` });
      }

      const res = await app.request("/orders?page=1&limit=2", {
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.length, 2);
      assert.equal(body.pagination.page, 1);
      assert.equal(body.pagination.limit, 2);
      assert.ok(body.pagination.total >= 3);
    });

    it("filters by status", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token, { customerName: "Filter Me" });
      await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ status: "picked_up" }),
      });

      const res = await app.request("/orders?status=picked_up", {
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.ok(body.data.every((o: any) => o.status === "picked_up"));
      assert.ok(body.data.some((o: any) => o.id === order.id));
    });

    it("rejects a courier (403)", async () => {
      const courier = await registerAndLogin("courier");
      const res = await app.request("/orders", { headers: authHeader(courier.token) });
      assert.equal(res.status, 403);
    });
  });

  describe("GET /orders/:id", () => {
    it("returns 404 for a nonexistent order", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders/00000000-0000-0000-0000-000000000000", {
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 404);
      assert.equal(body.error.code, "ORDER_NOT_FOUND");
    });

    it("returns 400 for a malformed UUID", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders/not-a-uuid", { headers: authHeader(staff.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 400);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });
  });

  describe("PATCH /orders/:id/status — state machine", () => {
    it("walks the full valid sequence and records history + changedBy at each step", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const sequence = ["picked_up", "in_transit", "out_for_delivery", "delivered"];
      for (const status of sequence) {
        const res = await app.request(`/orders/${order.id}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json", ...authHeader(staff.token) },
          body: JSON.stringify({ status }),
        });
        const body = await jsonBody(res);
        assert.equal(res.status, 200, `expected 200 transitioning to ${status}`);
        assert.equal(body.data.status, status);
      }

      const detail = await jsonBody(
        await app.request(`/orders/${order.id}`, { headers: authHeader(staff.token) }),
      );
      assert.equal(detail.data.statusHistory.length, 5); // pending + 4 transitions
      assert.deepEqual(
        detail.data.statusHistory.map((h: any) => h.status),
        ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered"],
      );
      assert.ok(detail.data.statusHistory.every((h: any) => h.changedBy === staff.id));
    });

    it("rejects an invalid transition (pending -> delivered) and does not partially mutate order/history", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ status: "delivered" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 409);
      assert.equal(body.error.code, "INVALID_STATUS_TRANSITION");

      const detail = await jsonBody(
        await app.request(`/orders/${order.id}`, { headers: authHeader(staff.token) }),
      );
      assert.equal(detail.data.status, "pending", "order status must remain unchanged");
      assert.equal(detail.data.statusHistory.length, 1, "no history row should have been inserted");
    });

    it("rejects delivered -> cancelled with 409", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);
      for (const status of ["picked_up", "in_transit", "out_for_delivery", "delivered"]) {
        await app.request(`/orders/${order.id}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json", ...authHeader(staff.token) },
          body: JSON.stringify({ status }),
        });
      }

      const res = await app.request(`/orders/${order.id}`, {
        method: "DELETE",
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 409);
      assert.equal(body.error.code, "ORDER_ALREADY_DELIVERED");
    });

    it("rejects an invalid status value with a validation error", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ status: "not_a_real_status" }),
      });
      assert.equal(res.status, 400);
    });

    it("rejects a courier attempting to update status (403)", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(courier.token) },
        body: JSON.stringify({ status: "picked_up" }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("DELETE /orders/:id — cancellation", () => {
    it("cancels a pending order (soft delete: status=cancelled, cancelledAt set, row still queryable)", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}`, {
        method: "DELETE",
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.status, "cancelled");
      assert.notEqual(body.data.cancelledAt, null);

      const stillThere = await app.request(`/orders/${order.id}`, {
        headers: authHeader(staff.token),
      });
      assert.equal(stillThere.status, 200, "the row must still exist after cancellation");
    });

    it("cancels from an intermediate non-terminal state (in_transit)", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);
      await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ status: "picked_up" }),
      });
      await app.request(`/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ status: "in_transit" }),
      });

      const res = await app.request(`/orders/${order.id}`, {
        method: "DELETE",
        headers: authHeader(staff.token),
      });
      assert.equal(res.status, 200);
    });

    it("rejects cancelling an already-cancelled order", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);
      await app.request(`/orders/${order.id}`, { method: "DELETE", headers: authHeader(staff.token) });

      const res = await app.request(`/orders/${order.id}`, {
        method: "DELETE",
        headers: authHeader(staff.token),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 409);
      assert.equal(body.error.code, "ORDER_ALREADY_CANCELLED");
    });

    it("rejects a courier attempting to cancel (403)", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}`, {
        method: "DELETE",
        headers: authHeader(courier.token),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("validation edge cases", () => {
    it("rejects a non-positive packageWeight", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({
          customerName: "X",
          pickupAddress: "A",
          dropoffAddress: "B",
          packageWeight: -1,
        }),
      });
      assert.equal(res.status, 400);
    });

    it("rejects an empty customerName", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({
          customerName: "",
          pickupAddress: "A",
          dropoffAddress: "B",
          packageWeight: 1,
        }),
      });
      assert.equal(res.status, 400);
    });

    it("clamps/rejects an out-of-range pagination limit", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders?limit=1000", { headers: authHeader(staff.token) });
      assert.equal(res.status, 400);
    });

    it("rejects a non-numeric page value", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders?page=abc", { headers: authHeader(staff.token) });
      assert.equal(res.status, 400);
    });

    it("every error response follows the { success:false, error:{code,message} } shape", async () => {
      const res = await app.request("/orders/not-a-uuid");
      const body = await jsonBody(res);
      assert.equal(body.success, false);
      assert.equal(typeof body.error.code, "string");
      assert.equal(typeof body.error.message, "string");
    });
  });
});
