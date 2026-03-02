import express from 'express';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import type {
  AuthRepository,
  AuthUser,
  CreateUserData,
  PasswordResetTokenRecord,
} from '../types.js';
import type { AuthServerConfig } from '../config.js';
import { authRouter } from '../routes/auth.js';
import { userRouter } from '../routes/user.js';
import { createCsrfMiddleware } from '../middleware/csrf.js';

// Fixed CSRF values for tests
export const CSRF_TOKEN = 'test-csrf-token-abc123';
export const CSRF_COOKIE = 'test_csrf';

export function createTestConfig(overrides?: Partial<AuthServerConfig>): AuthServerConfig {
  return {
    jwtSecret: 'test-jwt-secret-deterministic',
    tokenExpiry: '24h',
    saltRounds: 4, // fast for tests
    cookieName: 'test_auth',
    csrfCookieName: CSRF_COOKIE,
    emailHmacKey: 'test-hmac-key-deterministic',
    emailEncryptionKey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    resetTokenExpiryMs: 60 * 60 * 1000,
    appName: 'TestApp',
    appBaseUrl: 'http://localhost:3000',
    email: {
      resendApiKey: undefined,
      smtpHost: 'localhost',
      smtpPort: 587,
      emailFrom: 'test@example.com',
    },
    ...overrides,
  };
}

export function createMockRepo(): AuthRepository {
  const users: AuthUser[] = [];
  const resetTokens: PasswordResetTokenRecord[] = [];
  let nextUserId = 1;
  let nextTokenId = 1;

  return {
    async findUserByUsername(username: string): Promise<AuthUser | null> {
      return users.find((u) => u.username === username) ?? null;
    },

    async findUserById(id: number): Promise<AuthUser | null> {
      return users.find((u) => u.id === id) ?? null;
    },

    async getUserTokenVersion(id: number): Promise<number | null> {
      const user = users.find((u) => u.id === id);
      return user ? user.tokenVersion : null;
    },

    async createUser(data: CreateUserData): Promise<AuthUser> {
      // Simulate Prisma P2002 for unique constraint violations
      if (users.some((u) => u.username === data.username)) {
        const err = new Error('Unique constraint failed') as Error & {
          code: string;
          meta: { target: string[] };
        };
        err.code = 'P2002';
        err.meta = { target: ['username'] };
        throw err;
      }
      if (users.some((u) => u.emailEncrypted && data.emailHash === hashForUser(u))) {
        const err = new Error('Unique constraint failed') as Error & {
          code: string;
          meta: { target: string[] };
        };
        err.code = 'P2002';
        err.meta = { target: ['email_hash'] };
        throw err;
      }

      const user: AuthUser = {
        id: nextUserId++,
        username: data.username,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        tokenVersion: 0,
        emailEncrypted: data.emailEncrypted,
      };
      // Store emailHash alongside for duplicate checking
      (user as AuthUser & { emailHash?: string }).emailHash = data.emailHash;
      users.push(user);
      return user;
    },

    async incrementTokenVersion(userId: number): Promise<void> {
      const user = users.find((u) => u.id === userId);
      if (user) user.tokenVersion++;
    },

    async updatePasswordAndInvalidateSessions(userId: number, passwordHash: string): Promise<void> {
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.passwordHash = passwordHash;
        user.tokenVersion++;
      }
    },

    async updateEmail(userId: number, emailHash: string, emailEncrypted: string): Promise<void> {
      // Check for duplicate email
      if (
        users.some(
          (u) => u.id !== userId && (u as AuthUser & { emailHash?: string }).emailHash === emailHash
        )
      ) {
        const err = new Error('Unique constraint failed') as Error & {
          code: string;
          meta: { target: string[] };
        };
        err.code = 'P2002';
        err.meta = { target: ['email_hash'] };
        throw err;
      }

      const user = users.find((u) => u.id === userId);
      if (user) {
        user.emailEncrypted = emailEncrypted;
        (user as AuthUser & { emailHash?: string }).emailHash = emailHash;
      }
    },

    async createPasswordResetToken(data: {
      userId: number;
      tokenHash: string;
      expiresAt: Date;
    }): Promise<void> {
      resetTokens.push({
        id: nextTokenId++,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
      });
    },

    async findValidResetToken(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
      return resetTokens.find((t) => t.tokenHash === tokenHash) ?? null;
    },

    async markResetTokenUsed(tokenId: number): Promise<void> {
      const token = resetTokens.find((t) => t.id === tokenId);
      if (token) token.usedAt = new Date();
    },
  };

  function hashForUser(u: AuthUser): string | undefined {
    return (u as AuthUser & { emailHash?: string }).emailHash;
  }
}

export function createTestApp(repo?: AuthRepository, config?: AuthServerConfig) {
  const r = repo ?? createMockRepo();
  const c = config ?? createTestConfig();
  const app = express();

  app.use(cookieParser());
  app.use(express.json());

  const { setCsrfCookie, csrfProtection } = createCsrfMiddleware(c);
  app.use(setCsrfCookie);
  app.use(csrfProtection);

  app.use('/api/auth', authRouter(r, c));
  app.use('/api/user', userRouter(r, c));

  return { app, repo: r, config: c };
}

/** Returns a supertest agent that injects CSRF cookie + header on POST/PUT requests. */
export function postWithCsrf(app: express.Express, url: string) {
  return supertest(app)
    .post(url)
    .set('Cookie', `${CSRF_COOKIE}=${CSRF_TOKEN}`)
    .set('x-csrf-token', CSRF_TOKEN);
}

export function putWithCsrf(app: express.Express, url: string) {
  return supertest(app)
    .put(url)
    .set('Cookie', `${CSRF_COOKIE}=${CSRF_TOKEN}`)
    .set('x-csrf-token', CSRF_TOKEN);
}

/** Helper to make an authenticated request by logging in first, returning the auth cookie. */
export async function getAuthCookie(
  app: express.Express,
  username: string,
  password: string
): Promise<string> {
  const res = await postWithCsrf(app, '/api/auth/login').send({ username, password });
  const cookies = res.headers['set-cookie'];
  if (!cookies) throw new Error('No cookies set on login response');
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  return cookieArray.join('; ');
}
