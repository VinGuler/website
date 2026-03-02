import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { createCsrfMiddleware } from '../middleware/csrf.js';
import { createTestConfig, CSRF_COOKIE } from './helpers.js';

function createCsrfApp() {
  const config = createTestConfig();
  const { setCsrfCookie, csrfProtection } = createCsrfMiddleware(config);
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(setCsrfCookie);
  app.use(csrfProtection);

  app.get('/api/test', (_req, res) => res.json({ ok: true }));
  app.post('/api/test', (_req, res) => res.json({ ok: true }));
  app.post('/non-api/test', (_req, res) => res.json({ ok: true }));

  return app;
}

describe('CSRF middleware', () => {
  describe('setCsrfCookie', () => {
    it('sets csrf cookie when absent', async () => {
      const app = createCsrfApp();
      const res = await supertest(app).get('/api/test');
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const csrfCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) =>
        c.startsWith(`${CSRF_COOKIE}=`)
      );
      expect(csrfCookie).toBeDefined();
    });

    it('skips setting cookie when already present', async () => {
      const app = createCsrfApp();
      const res = await supertest(app)
        .get('/api/test')
        .set('Cookie', `${CSRF_COOKIE}=existing-token`);
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const csrfCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) =>
          c.startsWith(`${CSRF_COOKIE}=`)
        );
        expect(csrfCookie).toBeUndefined();
      }
    });
  });

  describe('csrfProtection', () => {
    it('GET requests bypass CSRF check', async () => {
      const app = createCsrfApp();
      const res = await supertest(app).get('/api/test');
      expect(res.status).toBe(200);
    });

    it('non-/api/ POST paths bypass CSRF check', async () => {
      const app = createCsrfApp();
      const res = await supertest(app).post('/non-api/test');
      expect(res.status).toBe(200);
    });

    it('POST to /api/* without token returns 403', async () => {
      const app = createCsrfApp();
      const res = await supertest(app).post('/api/test');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid CSRF token');
    });

    it('POST to /api/* with matching cookie+header passes', async () => {
      const app = createCsrfApp();
      const token = 'valid-csrf-token';
      const res = await supertest(app)
        .post('/api/test')
        .set('Cookie', `${CSRF_COOKIE}=${token}`)
        .set('x-csrf-token', token);
      expect(res.status).toBe(200);
    });

    it('POST to /api/* with mismatched cookie+header returns 403', async () => {
      const app = createCsrfApp();
      const res = await supertest(app)
        .post('/api/test')
        .set('Cookie', `${CSRF_COOKIE}=token-a`)
        .set('x-csrf-token', 'token-b');
      expect(res.status).toBe(403);
    });
  });
});
