import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import {
  createTestApp,
  createMockRepo,
  createTestConfig,
  postWithCsrf,
  getAuthCookie,
} from './helpers.js';
import type { AuthRepository } from '../types.js';
import type { AuthServerConfig } from '../config.js';
import type express from 'express';

// Mock nodemailer to avoid real SMTP connections
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }),
    })),
  },
}));

const VALID_PASSWORD = 'StrongPass1';

describe('auth routes', () => {
  let app: express.Express;
  let repo: AuthRepository;
  let config: AuthServerConfig;

  beforeEach(() => {
    const testApp = createTestApp();
    app = testApp.app;
    repo = testApp.repo;
    config = testApp.config;
  });

  describe('POST /api/auth/register', () => {
    it('valid registration returns 200 with user data and cookie', async () => {
      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('alice');
      expect(res.body.data.displayName).toBe('Alice');
      expect(res.body.data.id).toBeDefined();

      // Auth cookie should be set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) =>
        c.startsWith(`${config.cookieName}=`)
      );
      expect(authCookie).toBeDefined();
    });

    it('missing fields returns 400', async () => {
      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
      });
      expect(res.status).toBe(400);
    });

    it('weak password returns 400', async () => {
      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: 'weak',
        email: 'alice@example.com',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password must be');
    });

    it('invalid username returns 400', async () => {
      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'a',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Username');
    });

    it('invalid email returns 400', async () => {
      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'not-an-email',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('duplicate username returns 409', async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });

      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice2',
        password: VALID_PASSWORD,
        email: 'alice2@example.com',
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Username already taken');
    });

    it('duplicate email returns 409', async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'same@example.com',
      });

      const res = await postWithCsrf(app, '/api/auth/register').send({
        username: 'bob',
        displayName: 'Bob',
        password: VALID_PASSWORD,
        email: 'same@example.com',
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });
    });

    it('valid login returns 200 with user data and cookie', async () => {
      const res = await postWithCsrf(app, '/api/auth/login').send({
        username: 'alice',
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('alice');
    });

    it('wrong password returns 401', async () => {
      const res = await postWithCsrf(app, '/api/auth/login').send({
        username: 'alice',
        password: 'WrongPass1',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid username or password');
    });

    it('non-existent user returns 401', async () => {
      const res = await postWithCsrf(app, '/api/auth/login').send({
        username: 'nobody',
        password: VALID_PASSWORD,
      });
      expect(res.status).toBe(401);
    });

    it('too-long password returns 401', async () => {
      const res = await postWithCsrf(app, '/api/auth/login').send({
        username: 'alice',
        password: 'A'.repeat(1001),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears cookie and increments tokenVersion', async () => {
      // Register and get auth cookie
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });
      const authCookie = await getAuthCookie(app, 'alice', VALID_PASSWORD);

      const res = await supertest(app)
        .post('/api/auth/logout')
        .set('Cookie', `${authCookie}; test_csrf=test-csrf-token-abc123`)
        .set('x-csrf-token', 'test-csrf-token-abc123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Old token should be rejected
      const meRes = await supertest(app).get('/api/auth/me').set('Cookie', authCookie);
      expect(meRes.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('authenticated user gets their data', async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });
      const authCookie = await getAuthCookie(app, 'alice', VALID_PASSWORD);

      const res = await supertest(app).get('/api/auth/me').set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('alice');
      expect(res.body.data.displayName).toBe('Alice');
    });

    it('unauthenticated returns 401', async () => {
      const res = await supertest(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('always returns 200 regardless of user existence', async () => {
      const res = await postWithCsrf(app, '/api/auth/forgot-password').send({
        username: 'nonexistent',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('creates reset token for existing user', async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });

      const res = await postWithCsrf(app, '/api/auth/forgot-password').send({
        username: 'alice',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let rawToken: string;

    beforeEach(async () => {
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'alice',
        displayName: 'Alice',
        password: VALID_PASSWORD,
        email: 'alice@example.com',
      });

      // Create a reset token manually in the repo
      rawToken = 'abc123resettoken';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      await repo.createPasswordResetToken({
        userId: 1,
        tokenHash,
        expiresAt: new Date(Date.now() + 3_600_000),
      });
    });

    it('valid token resets password and returns 200', async () => {
      const res = await postWithCsrf(app, '/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'NewStrong1',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Should be able to login with new password
      const loginRes = await postWithCsrf(app, '/api/auth/login').send({
        username: 'alice',
        password: 'NewStrong1',
      });
      expect(loginRes.status).toBe(200);
    });

    it('expired token returns 400', async () => {
      // Create an expired token
      const expiredToken = 'expiredtoken123';
      const tokenHash = createHash('sha256').update(expiredToken).digest('hex');
      await repo.createPasswordResetToken({
        userId: 1,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      const res = await postWithCsrf(app, '/api/auth/reset-password').send({
        token: expiredToken,
        newPassword: 'NewStrong1',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('used token returns 400', async () => {
      // Use the token first
      await postWithCsrf(app, '/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'NewStrong1',
      });

      // Try to use it again
      const res = await postWithCsrf(app, '/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'AnotherPass1',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('weak password returns 400', async () => {
      const res = await postWithCsrf(app, '/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'weak',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password must be');
    });
  });
});
