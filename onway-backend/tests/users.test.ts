import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { truncateAll, closeTestDb } from "./helpers/setup";
import { app, jsonBody, authHeader, registerAndLogin } from "./helpers/fixtures";

describe("admin user management", () => {
  before(async () => {
    await truncateAll();
  });

  after(async () => {
    await closeTestDb();
  });

  describe("GET /users", () => {
    it("admin can list users", async () => {
      const admin = await registerAndLogin("admin");
      await registerAndLogin("staff");

      const res = await app.request("/users", { headers: authHeader(admin.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 2);
      assert.ok(body.pagination);
    });

    it("staff gets 403", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/users", { headers: authHeader(staff.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 403);
      assert.equal(body.error.code, "FORBIDDEN");
    });

    it("courier gets 403", async () => {
      const courier = await registerAndLogin("courier");
      const res = await app.request("/users", { headers: authHeader(courier.token) });
      assert.equal(res.status, 403);
    });

    it("never returns passwordHash", async () => {
      const admin = await registerAndLogin("admin");
      const res = await app.request("/users", { headers: authHeader(admin.token) });
      const body = await jsonBody(res);

      assert.ok(body.data.every((u: any) => !("passwordHash" in u) && !("password_hash" in u)));
    });

    it("pagination works", async () => {
      const admin = await registerAndLogin("admin");
      for (let i = 0; i < 3; i++) {
        await registerAndLogin("staff");
      }

      const res = await app.request("/users?page=1&limit=2", { headers: authHeader(admin.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.length, 2);
      assert.equal(body.pagination.page, 1);
      assert.equal(body.pagination.limit, 2);
      assert.ok(body.pagination.total >= 4);
    });

    it("role filter works", async () => {
      const admin = await registerAndLogin("admin");
      const courier = await registerAndLogin("courier");

      const res = await app.request("/users?role=courier", { headers: authHeader(admin.token) });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.ok(body.data.every((u: any) => u.role === "courier"));
      assert.ok(body.data.some((u: any) => u.id === courier.id));
    });

    it("search works (name or email)", async () => {
      const admin = await registerAndLogin("admin");
      const target = await registerAndLogin("staff", { name: "Zsearchable Person" });

      const res = await app.request(
        `/users?search=${encodeURIComponent("Zsearchable")}`,
        { headers: authHeader(admin.token) },
      );
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.ok(body.data.some((u: any) => u.id === target.id));
    });
  });

  describe("POST /users (admin create)", () => {
    it("admin can create a user with an explicit role", async () => {
      const admin = await registerAndLogin("admin");
      const res = await app.request("/users", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({
          name: "New Courier",
          email: `new.courier.${Date.now()}@test.local`,
          password: "correcthorse123",
          role: "courier",
        }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 201);
      assert.equal(body.data.role, "courier");
      assert.ok(!("passwordHash" in body.data));
    });

    it("staff gets 403", async () => {
      const staff = await registerAndLogin("staff");
      const res = await app.request("/users", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({
          name: "X",
          email: `x.${Date.now()}@test.local`,
          password: "correcthorse123",
          role: "staff",
        }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("PATCH /users/:id/role", () => {
    it("admin can promote staff -> courier", async () => {
      const admin = await registerAndLogin("admin");
      const staff = await registerAndLogin("staff");

      const res = await app.request(`/users/${staff.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "courier" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.role, "courier");
    });

    it("admin can promote staff -> admin", async () => {
      const admin = await registerAndLogin("admin");
      const staff = await registerAndLogin("staff");

      const res = await app.request(`/users/${staff.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "admin" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.role, "admin");
    });

    it("admin can promote courier -> staff", async () => {
      const admin = await registerAndLogin("admin");
      const courier = await registerAndLogin("courier");

      const res = await app.request(`/users/${courier.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.role, "staff");
    });

    it("admin can demote another admin -> staff when a third admin still exists", async () => {
      await registerAndLogin("admin"); // keeps at least one admin after the demotion below
      const admin = await registerAndLogin("admin");
      const targetAdmin = await registerAndLogin("admin");

      const res = await app.request(`/users/${targetAdmin.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.role, "staff");
    });

    it("staff gets 403", async () => {
      const staff = await registerAndLogin("staff");
      const other = await registerAndLogin("staff");

      const res = await app.request(`/users/${other.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(staff.token) },
        body: JSON.stringify({ role: "courier" }),
      });
      assert.equal(res.status, 403);
    });

    it("courier gets 403", async () => {
      const courier = await registerAndLogin("courier");
      const other = await registerAndLogin("staff");

      const res = await app.request(`/users/${other.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(courier.token) },
        body: JSON.stringify({ role: "courier" }),
      });
      assert.equal(res.status, 403);
    });

    it("malformed user id is rejected with a validation error", async () => {
      const admin = await registerAndLogin("admin");
      const res = await app.request("/users/not-a-uuid/role", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 400);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    it("nonexistent user returns 404", async () => {
      const admin = await registerAndLogin("admin");
      const res = await app.request("/users/00000000-0000-0000-0000-000000000000/role", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 404);
      assert.equal(body.error.code, "USER_NOT_FOUND");
    });

    it("invalid role value returns a validation error", async () => {
      const admin = await registerAndLogin("admin");
      const staff = await registerAndLogin("staff");

      const res = await app.request(`/users/${staff.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "superadmin" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 400);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    it("same-role update is a no-op (200, no error)", async () => {
      const admin = await registerAndLogin("admin");
      const staff = await registerAndLogin("staff");

      const res = await app.request(`/users/${staff.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(admin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 200);
      assert.equal(body.data.role, "staff");
    });

    it("last-admin protection: cannot demote the only admin", async () => {
      // This assertion specifically needs there to be exactly one admin
      // in the whole system -- truncate first so admins created by
      // earlier tests in this file don't make the count ambiguous.
      await truncateAll();
      const onlyAdmin = await registerAndLogin("admin");

      const res = await app.request(`/users/${onlyAdmin.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeader(onlyAdmin.token) },
        body: JSON.stringify({ role: "staff" }),
      });
      const body = await jsonBody(res);

      assert.equal(res.status, 409);
      assert.equal(body.error.code, "LAST_ADMIN");
    });
  });
});
