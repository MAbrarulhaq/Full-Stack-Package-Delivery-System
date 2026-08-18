import { eq } from "drizzle-orm";
import type { DbClient } from "../db/index";
import { users } from "../db/schema/index";
import type { userRoleEnum } from "../db/schema/index";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

/**
 * Data access for the `users` table. No password hashing, JWT signing, or
 * auth logic lives here — this repository only reads/writes rows. Hashing
 * happens in the service layer (Step 4+), which then passes an
 * already-hashed `passwordHash` into `create()`.
 */
export const userRepository = {
  async findById(dbClient: DbClient, id: string): Promise<User | undefined> {
    return dbClient.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  /** Needed by the future login flow to look up a user by email. */
  async findByEmail(dbClient: DbClient, email: string): Promise<User | undefined> {
    return dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async create(dbClient: DbClient, data: NewUser): Promise<User> {
    const [user] = await dbClient.insert(users).values(data).returning();
    if (!user) {
      throw new Error("Insert into users returned no row.");
    }
    return user;
  },

  /** Users with role = 'courier' — used by the courier-assignment bonus. */
  async findCouriers(dbClient: DbClient): Promise<User[]> {
    return dbClient.query.users.findMany({
      where: eq(users.role, "courier"),
    });
  },
};
