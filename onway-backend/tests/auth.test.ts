import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { truncateAll, closeTestDb } from "./helpers/setup";
import { app, jsonBody, registerAndLogin } from "./helpers/fixtures";

describe("auth", () => {
  before(async () => {
    await truncateAll();
  });

  after(async () => {
    await closeTestDb();
  });

  it("registers successfully and defaults role to staff, never exposing passwordHash", async () => {
    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice.auth@test.local",
        password: "correcthorse123",
      }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "staff");
    assert.equal(body.data.email, "alice.auth@test.local");
    assert.equal("passwordHash" in body.data, false);
    assert.equal("password_hash" in body.data, false);
  });

  it("rejects duplicate email registration", async () => {
    await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Dup",
        email: "dup.auth@test.local",
        password: "correcthorse123",
      }),
    });

    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Dup Again",
        email: "dup.auth@test.local",
        password: "anotherpassword",
      }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 409);
    assert.equal(body.error.code, "EMAIL_ALREADY_REGISTERED");
  });

  it("rejects a client-supplied role on registration", async () => {
    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "WannabeAdmin",
        email: "wannabe.auth@test.local",
        password: "correcthorse123",
        role: "admin",
      }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("logs in successfully with correct credentials and returns a JWT", async () => {
    await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Login Test",
        email: "login.auth@test.local",
        password: "correcthorse123",
      }),
    });

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "login.auth@test.local", password: "correcthorse123" }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 200);
    assert.equal(typeof body.data.token, "string");
    assert.ok(body.data.token.length > 20);
    assert.equal("passwordHash" in body.data.user, false);
  });

  it("rejects login with an incorrect password using a generic error", async () => {
    await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Wrong Pw",
        email: "wrongpw.auth@test.local",
        password: "correcthorse123",
      }),
    });

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wrongpw.auth@test.local", password: "definitely-wrong" }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 401);
    assert.equal(body.error.code, "INVALID_CREDENTIALS");
  });

  it("rejects login for an unknown email with the SAME generic error as wrong password", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "nobody.auth@test.local", password: "whatever123" }),
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 401);
    assert.equal(body.error.code, "INVALID_CREDENTIALS");
    assert.equal(body.error.message, "Invalid email or password");
  });

  it("GET /auth/me returns the correct user with a valid token", async () => {
    const user = await registerAndLogin("staff", { name: "Me Test" });

    const res = await app.request("/auth/me", {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 200);
    assert.equal(body.data.id, user.id);
    assert.equal(body.data.email, user.email);
    assert.equal("passwordHash" in body.data, false);
  });

  it("GET /auth/me without a token returns 401", async () => {
    const res = await app.request("/auth/me");
    const body = await jsonBody(res);

    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  });

  it("GET /auth/me with a malformed Authorization header returns 401", async () => {
    const res = await app.request("/auth/me", {
      headers: { Authorization: "NotBearer something" },
    });
    assert.equal(res.status, 401);
  });

  it("GET /auth/me with a garbage token returns 401 INVALID_TOKEN", async () => {
    const res = await app.request("/auth/me", {
      headers: { Authorization: "Bearer this.is.not.valid" },
    });
    const body = await jsonBody(res);

    assert.equal(res.status, 401);
    assert.equal(body.error.code, "INVALID_TOKEN");
  });

  it("a protected endpoint without a JWT returns 401", async () => {
    const res = await app.request("/orders");
    assert.equal(res.status, 401);
  });
});
