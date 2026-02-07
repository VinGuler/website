import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('API', () => {
  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET / (dev mode)', () => {
    it('should return a message when no static files are built', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('API Server');
    });
  });
});
