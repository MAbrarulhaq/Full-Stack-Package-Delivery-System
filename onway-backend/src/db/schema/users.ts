import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

/**
 * Represents staff, admins, and couriers via a single `role` column —
 * see the architecture blueprint (§10/§11) for why this isn't split into
 * separate `staff`/`couriers` tables.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    // Never selected out to API responses — enforced at the repository/DTO
    // layer in a later step, not by the schema itself.
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Enforces no-duplicate-accounts AND powers the login lookup
    // (WHERE email = ?) with the same index — see blueprint §J.
    uniqueIndex("users_email_idx").on(table.email),
  ],
);
