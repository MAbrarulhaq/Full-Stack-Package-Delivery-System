import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { truncateAll, closeTestDb } from "./helpers/setup";
import { app, jsonBody, authHeader, registerAndLogin, createTestOrder } from "./helpers/fixtures";

describe("courier functionality", () => {
  before(async () => {
    await truncateAll();
  });

  after(async () => {
    await closeTestDb();
  });

  describe("GET /users/couriers", () => {
    it("staff can list couriers, and passwordHash is never returned", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier", { name: "Listed Courier" });

      const res = await app.request("/users/couriers", { headers: authHeader(staff.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.ok(body.data.some((u: any) => u.id === courier.id));
      assert.ok(body.data.every((u: any) => u.role === "courier"));
      assert.ok(body.data.every((u: any) => !("passwordHash" in u) && !("password_hash" in u)));
    });

    it("admin can list couriers", async () => {
      const admin = await registerAndLogin("admin");
      const res = await app.request("/users/couriers", { headers: authHeader(admin.token) });
      assert.equal(res.status, 200);
    });

    it("a courier cannot access the courier list (403)", async () => {
      const courier = await registerAndLogin("courier");
      const res = await app.request("/users/couriers", { headers: authHeader(courier.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });
  });

  describe("PATCH /orders/:id/assign", () => {
    it("staff can assign a courier; status is unaffected", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courier.id }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.courierId, courier.id);
      assert.equal(body.data.status, "pending", "assignment must not change order status");
    });

    it("returns a not-found error for a nonexistent courier id", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: "00000000-0000-0000-0000-000000000000" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 404);
      assert.equal(body.error.code, "COURIER_NOT_FOUND");
    });

    it("rejects assigning a non-courier (staff) user, and leaves the order unassigned", async () => {
      const staff = await registerAndLogin("staff");
      const otherStaff = await registerAndLogin("staff", { name: "Other Staff" });
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: otherStaff.id }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 409);
      assert.equal(body.error.code, "USER_NOT_COURIER");

      const detail = await jsonBody(
        await app.request(`/orders/${order.id}`, { headers: authHeader(staff.token) }),
      );
      assert.equal(detail.data.courierId, null);
    });

    it("rejects a malformed courierId with a validation error", async () => {
      const staff = await registerAndLogin("staff");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: "not-a-uuid" }),
      });
      assert.equal(res.status, 400);
    });

    it("rejects a courier attempting to assign orders (403)", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);

      const res = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(courier.token) },
        body: JSON.stringify({ courierId: courier.id }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("GET /orders/my", () => {
    it("returns only the authenticated courier's assigned orders, with pagination", async () => {
      const staff = await registerAndLogin("staff");
      const courierA = await registerAndLogin("courier", { name: "Courier A" });
      const courierB = await registerAndLogin("courier", { name: "Courier B" });

      const orderForA = await createTestOrder(staff.token, { customerName: "For A" });
      const orderForB = await createTestOrder(staff.token, { customerName: "For B" });
      const unassigned = await createTestOrder(staff.token, { customerName: "Unassigned" });

      await app.request(`/orders/${orderForA.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courierA.id }),
      });
      await app.request(`/orders/${orderForB.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courierB.id }),
      });

      const res = await app.request("/orders/my", { headers: authHeader(courierA.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      const ids = body.data.map((o: any) => o.id);
      assert.ok(ids.includes(orderForA.id), "courier A's own order must appear");
      assert.ok(!ids.includes(orderForB.id), "courier B's order must be excluded");
      assert.ok(!ids.includes(unassigned.id), "the unassigned order must be excluded");
      assert.equal(typeof body.pagination.total, "number");
    });

    it("rejects staff/admin calling GET /orders/my (courier-only route)", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/orders/my", { headers: authHeader(staff.token) });
      assert.equal(res.status, 403);
    });
  });

  describe("courier ownership on GET /orders/:id", () => {
    it("the assigned courier can access the order", async () => {
      const staff = await registerAndLogin("staff");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);
      await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courier.id }),
      });

      const res = await app.request(`/orders/${order.id}`, { headers: authHeader(courier.token) });
      assert.equal(res.status, 200);
    });

    it("a DIFFERENT courier receives 403", async () => {
      const staff = await registerAndLogin("staff");
      const courierA = await registerAndLogin("courier", { name: "Owner" });
      const courierB = await registerAndLogin("courier", { name: "Stranger" });
      const order = await createTestOrder(staff.token);
      await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courierA.id }),
      });

      const res = await app.request(`/orders/${order.id}`, { headers: authHeader(courierB.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });

    it("staff and admin can access any order regardless of assignment", async () => {
      const staff = await registerAndLogin("staff");
      const admin = await registerAndLogin("admin");
      const courier = await registerAndLogin("courier");
      const order = await createTestOrder(staff.token);
      await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courier.id }),
      });

      const staffRes = await app.request(`/orders/${order.id}`, { headers: authHeader(staff.token) });
      const adminRes = await app.request(`/orders/${order.id}`, { headers: authHeader(admin.token) });
      assert.equal(staffRes.status, 200);
      assert.equal(adminRes.status, 200);
    });
  });

  describe("reassignment", () => {
    it("reassigning from courier A to courier B transfers access correctly", async () => {
      const staff = await registerAndLogin("staff");
      const courierA = await registerAndLogin("courier", { name: "Reassign A" });
      const courierB = await registerAndLogin("courier", { name: "Reassign B" });
      const order = await createTestOrder(staff.token);

      await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courierA.id }),
      });
      const aHasAccess = await app.request(`/orders/${order.id}`, { headers: authHeader(courierA.token) });
      assert.equal(aHasAccess.status, 200, "courier A should have access before reassignment");

      const reassignRes = await app.request(`/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ courierId: courierB.id }),
      });
      assert.equal(reassignRes.status, 200);

      const aLostAccess = await app.request(`/orders/${order.id}`, { headers: authHeader(courierA.token) });
      assert.equal(aLostAccess.status, 403, "courier A must lose access after reassignment");

      const bHasAccess = await app.request(`/orders/${order.id}`, { headers: authHeader(courierB.token) });
      assert.equal(bHasAccess.status, 200, "courier B must gain access after reassignment");
    });
  });
});
