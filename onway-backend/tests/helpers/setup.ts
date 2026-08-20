
 //Shared test setup.
  //Import this before the app or env config so tests use `.env.test`.
 // Includes a safety check to prevent destructive operations on a real database.
 

import { pool, db } from "../../src/db/index";
import { sql } from "drizzle-orm";

// Ensures tests are connected to a database with "test" in its name.
function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const dbNameMatch = url.match(/\/([^/?]+)(\?.*)?$/);
  const dbName = dbNameMatch?.[1] ?? "";

  if (!dbName.includes("test")) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL "${dbName}" does not look like a test database.`,
    );
  }
}

// Check the database as soon as this module is loaded.
assertTestDatabase();

// Clears all application tables before each test file.
export async function truncateAll(): Promise<void> {
  await db.execute(sql`TRUNCATE order_status_history, orders, users CASCADE`);
}

// Closes the database pool after the test file finishes.
export async function closeTestDb(): Promise<void> {
  await pool.end();
}