
import { sql } from "drizzle-orm";
import app from "../../src/app";
import { db } from "../../src/db/index";
import type { UserRole } from "../../src/repositories/user.repository";

export { app };

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: UserRole;
}

let counter = 0;
function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@test.local`;
}

export async function jsonBody(res: Response): Promise<any> {
  return res.json();
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// Registers and logs in through the real HTTP endpoints.
// Optionally sets the user's role directly in the database.
// Throws on unexpected responses so fixture failures are obvious.
export async function registerAndLogin(
  role: UserRole = "staff",
  overrides: { name?: string; password?: string } = {},
): Promise<TestUser> {
  const email = uniqueEmail(role);
  const password = overrides.password ?? "correcthorse123";
  const name = overrides.name ?? `Test ${role}`;

  const registerRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (registerRes.status !== 201) {
    throw new Error(
      `Fixture setup failed: register returned ${registerRes.status}: ${await registerRes.text()}`,
    );
  }
  const registerBody = await jsonBody(registerRes);
  const userId = registerBody.data.id as string;

  if (role !== "staff") {
    await db.execute(sql`UPDATE users SET role = ${role} WHERE id = ${userId}`);
  }

  const loginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (loginRes.status !== 200) {
    throw new Error(
      `Fixture setup failed: login returned ${loginRes.status}: ${await loginRes.text()}`,
    );
  }
  const loginBody = await jsonBody(loginRes);

  return { id: userId, email, password, token: loginBody.data.token as string, role };
}

export async function createTestOrder(
  staffToken: string,
  overrides: Partial<{
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    packageWeight: number;
  }> = {},
): Promise<any> {
  const res = await app.request("/orders", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(staffToken) },
    body: JSON.stringify({
      customerName: overrides.customerName ?? "Test Customer",
      pickupAddress: overrides.pickupAddress ?? "1 Test St",
      dropoffAddress: overrides.dropoffAddress ?? "2 Test Ave",
      packageWeight: overrides.packageWeight ?? 1.5,
    }),
  });
  if (res.status !== 201) {
    throw new Error(
      `Fixture setup failed: create order returned ${res.status}: ${await res.text()}`,
    );
  }
  return (await jsonBody(res)).data;
}
