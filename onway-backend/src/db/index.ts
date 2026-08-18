import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase, NodePgTransaction } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { env } from "../config/env";
import * as schema from "./schema/index";

/**
 * Single shared connection pool for the process. Reused across requests —
 * never instantiate a new Pool per-request.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Small ceiling appropriate for a single small service instance;
  // revisit if/when this runs behind heavy concurrent load.
  max: 10,
});

/**
 * Drizzle instance used throughout the app (repositories, services,
 * transactions). `schema` is passed so relational queries
 * (`db.query.orders.findFirst({ with: { statusHistory: true } })`) work.
 */
export const db = drizzle(pool, { schema });

export type Database = typeof db;

/**
 * Anything a repository method can run queries against: either the shared
 * pool-backed `db` instance, or a transaction handle (`tx`) obtained from
 * `db.transaction(async (tx) => { ... })`. Both expose the same query
 * builder / relational query API, so repository code never needs to branch
 * on which one it received — the caller (the service layer, from Step 4
 * onward) decides whether a call participates in a transaction.
 */
export type DbClient =
  | NodePgDatabase<typeof schema>
  | NodePgTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

/** Call on process shutdown to close pool connections cleanly. */
export async function closeDb(): Promise<void> {
  await pool.end();
}
