/**
 * Shared setup for every test file. Import this FIRST (before importing
 * ../src/app or anything that transitively imports src/config/env.ts) --
 * relies on `node --env-file=.env.test` already having set DATABASE_URL
 * in process.env before this module (or env.ts's `dotenv/config` call)
 * ever runs, which is what points the app under test at a separate
 * database instead of the developer's normal one.
 *
 * SAFETY GUARD: refuses to run any destructive operation unless the
 * resolved DATABASE_URL's database name contains "test". This exists
 * specifically so a missing/misconfigured .env.test can never truncate
 * a developer's real data -- it fails loudly instead.
 */
import { pool, db } from "../../src/db/index";
import { sql } from "drizzle-orm";

function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const dbNameMatch = url.match(/\/([^/?]+)(\?.*)?$/);
  const dbName = dbNameMatch?.[1] ?? "";

  if (!dbName.includes("test")) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL resolves to database "${dbName}", ` +
        `which doesn't look like a test database (expected the name to contain ` +
        `"test"). This guard exists to prevent the test suite from truncating a ` +
        `real development database. Run tests with ` +
        `"node --env-file=.env.test --import tsx --test ..." (see package.json's ` +
        `"test" script) and confirm .env.test points at a dedicated test database.`,
    );
  }
}

// Runs once per test FILE (each file is its own Node process under
// node:test's default isolation), the moment this module is imported.
assertTestDatabase();

/**
 * Wipes all application tables. Called from each test file's top-level
 * `before()` hook so every file starts from a known-empty state. Order
 * matters for FK constraints: history depends on orders, orders
 * optionally depends on users.
 */
export async function truncateAll(): Promise<void> {
  await db.execute(sql`TRUNCATE order_status_history, orders, users CASCADE`);
}

/** Call once in a file's top-level `after()` hook to release the pg pool so the test process can exit. */
export async function closeTestDb(): Promise<void> {
  await pool.end();
}
