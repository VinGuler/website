export interface JwtPayload {
  id: number;
  username: string;
  tokenVersion: number;
}

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
  tokenVersion: number;
  emailEncrypted: string | null;
}

export interface CreateUserData {
  username: string;
  displayName: string;
  passwordHash: string;
  emailHash: string;
  emailEncrypted: string;
}

export interface PasswordResetTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * DB-agnostic interface for auth data access. Apps implement this using their
 * own Prisma schema (or any ORM). The implementing app's createUser() is the
 * right place to include any app-specific post-registration logic (e.g.,
 * workspace creation) in the same transaction.
 *
 * Unique constraint errors from createUser() must be thrown as an object with
 * `code: 'P2002'` and `meta.target` containing the constraint name. This matches
 * Prisma's error shape, which is the mandated ORM in this monorepo.
 */
export interface AuthRepository {
  findUserByUsername(username: string): Promise<AuthUser | null>;
  findUserById(id: number): Promise<AuthUser | null>;
  /** Used in the auth middleware hot path — select only tokenVersion. */
  getUserTokenVersion(id: number): Promise<number | null>;
  createUser(data: CreateUserData): Promise<AuthUser>;
  incrementTokenVersion(userId: number): Promise<void>;
  /** Must atomically update passwordHash and increment tokenVersion. */
  updatePasswordAndInvalidateSessions(userId: number, passwordHash: string): Promise<void>;
  updateEmail(userId: number, emailHash: string, emailEncrypted: string): Promise<void>;
  createPasswordResetToken(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findValidResetToken(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  markResetTokenUsed(tokenId: number): Promise<void>;
}
