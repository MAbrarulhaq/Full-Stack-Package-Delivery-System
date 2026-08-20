import { db } from "../db/index";
import { userRepository } from "../repositories/user.repository";
import type { User, UserRole } from "../repositories/user.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { toSafeUser } from "../utils/user-dto";
import type { SafeUser } from "../utils/user-dto";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  NotFoundError,
  UserNotFoundError,
  LastAdminError,
} from "../errors/index";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: SafeUser;
  token: string;
}

export interface ListUsersInput {
  page: number;
  limit: number;
  role?: UserRole;
  search?: string;
}

export interface ListUsersResult {
  data: SafeUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export const userService = {
  async getCouriers(): Promise<SafeUser[]> {
    const couriers = await userRepository.findCouriers(db);
    return couriers.map(toSafeUser);
  },

  async getUserById(id: string): Promise<User | undefined> {
    return userRepository.findById(db, id);
  },
  async register(input: RegisterInput): Promise<SafeUser> {
    const existing = await userRepository.findByEmail(db, input.email);
    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create(db, {
      name: input.name,
      email: input.email,
      passwordHash,
      // role intentionally omitted -> DB default 'staff' applies
    });

    return toSafeUser(user);
  },

 
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await userRepository.findByEmail(db, input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const token = await signAuthToken({ id: user.id, role: user.role });

    return { user: toSafeUser(user), token };
  },

  // Used by GET /auth/me -- the JWT already proved identity, this just fetches the current row. 
  async getCurrentUser(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(db, id);
    if (!user) {
      // Edge case: a valid JWT for a user deleted after the token was
      // issued. Not expected in normal operation (no user-delete
      // endpoint exists), but handled defensively rather than silently
      // returning undefined.
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }
    return toSafeUser(user);
  },

  // GET /users (admin-only) -- same { data, pagination } shape as listOrders(). 
  async listUsers(input: ListUsersInput): Promise<ListUsersResult> {
    const { page, limit, role, search } = input;

    const [rows, total] = await Promise.all([
      userRepository.list(db, { page, limit, role, search }),
      userRepository.count(db, { role, search }),
    ]);

    return {
      data: rows.map(toSafeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  
  async updateUserRole(targetId: string, role: UserRole): Promise<SafeUser> {
    const target = await userRepository.findById(db, targetId);
    if (!target) {
      throw new UserNotFoundError(targetId);
    }

    if (target.role === role) {
      return toSafeUser(target);
    }

    if (target.role === "admin" && role !== "admin") {
      const adminCount = await userRepository.countByRole(db, "admin");
      if (adminCount <= 1) {
        throw new LastAdminError();
      }
    }

    const updated = await userRepository.updateRole(db, targetId, role);
    // updated is guaranteed defined: we just confirmed the row exists above.
    return toSafeUser(updated as User);
  },
  async createUserAsAdmin(input: RegisterInput & { role: UserRole }): Promise<SafeUser> {
    const existing = await userRepository.findByEmail(db, input.email);
    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create(db, {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return toSafeUser(user);
  },
};
