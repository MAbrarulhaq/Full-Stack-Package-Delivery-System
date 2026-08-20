import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import type { DbClient } from "../db/index";
import { users } from "../db/schema/index";
import type { userRoleEnum } from "../db/schema/index";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export interface ListUsersParams {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
}


 //Same filter (role + search-by-name-or-email) shared by list() and
 //count() below, so the two can never drift out of sync with each other
 //— a real risk if the WHERE clause were duplicated by hand in both
 // places.
 
function buildUserListFilter(params: { role?: UserRole; search?: string }) {
  const conditions = [];
  if (params.role) {
    conditions.push(eq(users.role, params.role));
  }
  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern)));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}


 //Data access for the `users` table. No password hashing, JWT signing, or
 //auth logic lives here — this repository only reads/writes rows. Hashing
 //happens in the service layer (Step 4+), which then passes an
 // already-hashed `passwordHash` into `create()`.
 
export const userRepository = {
  async findById(dbClient: DbClient, id: string): Promise<User | undefined> {
    return dbClient.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  // Needed by the future login flow to look up a user by email. 
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

  // Users with role = 'courier' — used by the courier-assignment bonus. 
  async findCouriers(dbClient: DbClient): Promise<User[]> {
    return dbClient.query.users.findMany({
      where: eq(users.role, "courier"),
    });
  },

  // Admin-only user directory listing — same list()/count() pairing pattern as orderRepository. 
  async list(dbClient: DbClient, params: ListUsersParams): Promise<User[]> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    return dbClient
      .select()
      .from(users)
      .where(buildUserListFilter(params))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async count(dbClient: DbClient, params: { role?: UserRole; search?: string }): Promise<number> {
    const [row] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(buildUserListFilter(params));

    return row?.count ?? 0;
  },

  // Used by the last-admin safety check before demoting an admin away from 'admin'. 
  async countByRole(dbClient: DbClient, role: UserRole): Promise<number> {
    const [row] = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, role));

    return row?.count ?? 0;
  },

  
  //Pure write: sets `users.role`. Does NOT enforce the last-admin
   //invariant — that's a service-layer decision (see
   // userService.updateUserRole).
   
  async updateRole(dbClient: DbClient, id: string, role: UserRole): Promise<User | undefined> {
    const [user] = await dbClient
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user;
  },
};
