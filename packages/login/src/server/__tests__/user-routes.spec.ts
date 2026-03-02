import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createTestApp, postWithCsrf, getAuthCookie, CSRF_COOKIE, CSRF_TOKEN } from './helpers.js';
import type { AuthRepository } from '../types.js';
import type { AuthServerConfig } from '../config.js';
import type express from 'express';

const VALID_PASSWORD = 'StrongPass1';

describe('user routes', () => {
  let app: express.Express;
  let repo: AuthRepository;
  let config: AuthServerConfig;
  let authCookie: string;

  beforeEach(async () => {
    const testApp = createTestApp();
    app = testApp.app;
    repo = testApp.repo;
    config = testApp.config;

    // Register a user
    await postWithCsrf(app, '/api/auth/register').send({
      username: 'alice',
      displayName: 'Alice',
      password: VALID_PASSWORD,
      email: 'alice@example.com',
    });

    authCookie = await getAuthCookie(app, 'alice', VALID_PASSWORD);
  });

  describe('GET /api/user/me/email', () => {
    it('returns masked email for authenticated user', async () => {
      const res = await supertest(app).get('/api/user/me/email').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.maskedEmail).toMatch(/^a\*\*\*@example\.com$/);
    });

    it('returns null maskedEmail when user has no email', async () => {
      // Register user without email, then clear it manually
      const user = await repo.findUserByUsername('alice');
      if (user) {
        user.emailEncrypted = null;
      }

      const res = await supertest(app).get('/api/user/me/email').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.maskedEmail).toBeNull();
    });

    it('returns 401 for unauthenticated request', async () => {
      const res = await supertest(app).get('/api/user/me/email');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user/email', () => {
    function putEmailWithAuth(authCookieStr: string) {
      const csrfCookie = `${CSRF_COOKIE}=${CSRF_TOKEN}`;
      return supertest(app)
        .put('/api/user/email')
        .set('Cookie', `${authCookieStr}; ${csrfCookie}`)
        .set('x-csrf-token', CSRF_TOKEN);
    }

    it('valid update returns new masked email', async () => {
      const res = await putEmailWithAuth(authCookie).send({
        currentPassword: VALID_PASSWORD,
        newEmail: 'newalice@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.maskedEmail).toMatch(/^n\*\*\*@example\.com$/);
    });

    it('wrong password returns 401', async () => {
      const res = await putEmailWithAuth(authCookie).send({
        currentPassword: 'WrongPass1',
        newEmail: 'newalice@example.com',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Current password is incorrect');
    });

    it('invalid email returns 400', async () => {
      const res = await putEmailWithAuth(authCookie).send({
        currentPassword: VALID_PASSWORD,
        newEmail: 'not-valid',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('duplicate email returns 409', async () => {
      // Register another user with a different email
      await postWithCsrf(app, '/api/auth/register').send({
        username: 'bob',
        displayName: 'Bob',
        password: VALID_PASSWORD,
        email: 'bob@example.com',
      });

      // Try to update alice's email to bob's email
      const res = await putEmailWithAuth(authCookie).send({
        currentPassword: VALID_PASSWORD,
        newEmail: 'bob@example.com',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Email already registered');
    });
  });
});
