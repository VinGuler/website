import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { createRequireAuth } from '../middleware/auth.js';
import { createMockRepo, createTestConfig } from './helpers.js';
import type { JwtPayload } from '../types.js';

function createAuthMiddlewareApp(tokenVersion = 0) {
  const config = createTestConfig();
  const repo = createMockRepo();

  // Pre-populate a user via direct repo manipulation
  const userPromise = repo.createUser({
    username: 'testuser',
    displayName: 'Test User',
    passwordHash: '$2b$04$fakehash',
    emailHash: 'fakehash',
    emailEncrypted: 'fakeencrypted',
  });

  const requireAuth = createRequireAuth(repo, config);
  const app = express();
  app.use(cookieParser());
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return { app, config, repo, userPromise };
}

describe('createRequireAuth', () => {
  it('returns 401 when no cookie is present', async () => {
    const { app } = createAuthMiddlewareApp();
    const res = await supertest(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('returns 401 for invalid JWT', async () => {
    const { app, config } = createAuthMiddlewareApp();
    const res = await supertest(app)
      .get('/protected')
      .set('Cookie', `${config.cookieName}=invalid-jwt-token`);
    expect(res.status).toBe(401);
  });

  it('returns 401 when tokenVersion mismatches', async () => {
    const { app, config, repo, userPromise } = createAuthMiddlewareApp();
    const user = await userPromise;

    // Sign token with tokenVersion 0
    const token = jwt.sign(
      { id: user.id, username: user.username, tokenVersion: 0 } satisfies JwtPayload,
      config.jwtSecret
    );

    // Increment tokenVersion to 1
    await repo.incrementTokenVersion(user.id);

    const res = await supertest(app)
      .get('/protected')
      .set('Cookie', `${config.cookieName}=${token}`);
    expect(res.status).toBe(401);
  });

  it('passes with valid JWT and matching tokenVersion', async () => {
    const { app, config, userPromise } = createAuthMiddlewareApp();
    const user = await userPromise;

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        tokenVersion: user.tokenVersion,
      } satisfies JwtPayload,
      config.jwtSecret
    );

    const res = await supertest(app)
      .get('/protected')
      .set('Cookie', `${config.cookieName}=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: user.id, username: 'testuser' });
  });
});
