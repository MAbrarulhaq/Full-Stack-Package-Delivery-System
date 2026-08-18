import { db } from "../db/index";
import { userRepository } from "../repositories/user.repository";
import type { User } from "../repositories/user.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { toSafeUser } from "../utils/user-dto";
import type { SafeUser } from "../utils/user-dto";
import { EmailAlreadyRegisteredError, InvalidCredentialsError, NotFoundError } from "../errors/index";

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

export const userService = {
  /**
   * Returns SAFE user objects (passwordHash stripped via toSafeUser),
   * same as every other method in this service. GET /users/couriers
   * (added when this was first exposed over HTTP) would otherwise leak
   * password hashes — this was a repository-level function with no
   * route before, so its output was never actually sanitized until now.
   */
  async getCouriers(): Promise<SafeUser[]> {
    const couriers = await userRepository.findCouriers(db);
    return couriers.map(toSafeUser);
  },

  async getUserById(id: string): Promise<User | undefined> {
    return userRepository.findById(db, id);
  },

  /**
   * Public registration. `role` is never accepted here -- the validated
   * input type (RegisterInput) doesn't even have a `role` field, and the
   * repository insert omits it entirely so the `users.role` column
   * default ('staff', set in the DB schema) is what actually applies.
   * Does NOT issue a JWT -- see the Step 4 plan note on register/login
   * being kept as separate concerns.
   */
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

  /**
   * Deliberately uses the SAME error (InvalidCredentialsError, generic
   * "Invalid email or password") whether the email doesn't exist or the
   * password is wrong -- never lets a caller distinguish the two, which
   * would otherwise let them enumerate registered emails.
   */
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

  /** Used by GET /auth/me -- the JWT already proved identity, this just fetches the current row. */
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
};
