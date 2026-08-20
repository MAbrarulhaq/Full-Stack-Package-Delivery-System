import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase, NodePgTransaction } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { env } from "../config/env";
import * as schema from "./schema/index";

// Shared connection pool for the process. Never create one per request.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Small pool size for a single service instance.
  max: 10,
});

// Shared Drizzle instance with the schema for relational queries.
export const db = drizzle(pool, { schema });

export type Database = typeof db;

// Repository client: shared db instance or transaction handle.
export type DbClient =
  | NodePgDatabase<typeof schema>
  | NodePgTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

// Close pool connections during process shutdown.
export async function closeDb(): Promise<void> {
  await pool.end();
}