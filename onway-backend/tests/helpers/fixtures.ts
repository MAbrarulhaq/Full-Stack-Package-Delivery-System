/**
 * Fixture helpers used by every test file to arrange scenarios. Every
 * behavioral action goes through app.request() (the real Hono app), same
 * as the tests themselves -- the ONE exception is promoting a user's
 * role, since no API endpoint exists for that (registration always
 * defaults to 'staff' by design -- see Step 4's report). That one write
 * is a direct DB update used purely for fixture setup, mirroring exactly
 * what was done manually via `docker exec psql` during manual testing --
 * it is never used to assert behavior, only to arrange a scenario the
 * HTTP layer is then tested against.
 */
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

/**
 * Registers (via the real HTTP endpoint), optionally promotes the role
 * via direct DB write (see file docstring), then logs in (also via the
 * real HTTP endpoint) to get a JWT that reflects the final role. Throws
 * loudly on any unexpected status so a broken fixture never masquerades
 * as a passing test.
 */
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
