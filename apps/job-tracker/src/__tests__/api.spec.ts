import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../server/index';

// Mock global fetch so the email service (inside @workspace/login) never calls
// the Resend API or real SMTP during tests.
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));

const CSRF_TOKEN = 'test-csrf-token';
const CSRF_COOKIE = `jt_csrf=${CSRF_TOKEN}`;

// Helper to register a user and extract the auth cookie
async function registerUser(
  username: string,
  displayName: string,
  password: string,
  email?: string
): Promise<{ cookie: string[] }> {
  const res = await request(app)
    .post('/api/auth/register')
    .set('Cookie', CSRF_COOKIE)
    .set('x-csrf-token', CSRF_TOKEN)
    .send({ username, displayName, password, email: email ?? `${username}@example.com` });
  const cookies = res.headers['set-cookie'] as unknown as string[];
  const cookie = [...cookies, CSRF_COOKIE];
  return { cookie };
}

/** Shorthand for authenticated + CSRF requests */
function authed(method: 'get' | 'post' | 'put' | 'delete', url: string, cookie: string[]) {
  return request(app)[method](url).set('Cookie', cookie).set('x-csrf-token', CSRF_TOKEN);
}

function postWithCsrf(url: string) {
  return request(app).post(url).set('Cookie', CSRF_COOKIE).set('x-csrf-token', CSRF_TOKEN);
}

// Clean DB before each test
beforeEach(async () => {
  await prisma.stage.deleteMany();
  await prisma.application.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Job Tracker API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/register creates user and returns cookie', async () => {
      const res = await postWithCsrf('/api/auth/register').send({
        username: 'testuser',
        displayName: 'Test User',
        password: 'Password123',
        email: 'test@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('GET /api/auth/me with valid cookie returns user', async () => {
      const { cookie } = await registerUser('meuser', 'Me User', 'Password123');
      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('meuser');
    });
  });

  describe('Applications API', () => {
    it('GET /api/applications without auth returns 401', async () => {
      const res = await request(app).get('/api/applications');
      expect(res.status).toBe(401);
    });

    it('GET /api/applications returns empty list initially', async () => {
      const { cookie } = await registerUser('appuser', 'App User', 'Password123');
      const res = await authed('get', '/api/applications', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('POST /api/applications creates a new application', async () => {
      const { cookie } = await registerUser('appuser2', 'App User 2', 'Password123');
      const res = await authed('post', '/api/applications', cookie).send({
        companyName: 'Acme Corp',
        role: 'Frontend Engineer',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companyName).toBe('Acme Corp');
      expect(res.body.data.role).toBe('Frontend Engineer');
      expect(res.body.data.status).toBe('APPLIED');
      expect(res.body.data.nextStep).toBeNull();
    });

    it('POST /api/applications returns 400 without required fields', async () => {
      const { cookie } = await registerUser('appuser3', 'App User 3', 'Password123');
      const res = await authed('post', '/api/applications', cookie).send({});

      expect(res.status).toBe(400);
    });

    it('PUT /api/applications/:id updates an application', async () => {
      const { cookie } = await registerUser('appuser4', 'App User 4', 'Password123');
      const createRes = await authed('post', '/api/applications', cookie).send({
        companyName: 'Acme',
        role: 'Dev',
      });
      const id = createRes.body.data.id;

      const res = await authed('put', `/api/applications/${id}`, cookie).send({
        status: 'IN_PROGRESS',
        salaryRange: '$100k-$120k',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.salaryRange).toBe('$100k-$120k');
    });

    it('DELETE /api/applications/:id deletes an application', async () => {
      const { cookie } = await registerUser('appuser5', 'App User 5', 'Password123');
      const createRes = await authed('post', '/api/applications', cookie).send({
        companyName: 'Delete Me',
        role: 'Dev',
      });
      const id = createRes.body.data.id;

      const res = await authed('delete', `/api/applications/${id}`, cookie);
      expect(res.status).toBe(200);

      const listRes = await authed('get', '/api/applications', cookie);
      expect(listRes.body.data).toHaveLength(0);
    });

    it("cannot access another user's application", async () => {
      const { cookie: cookie1 } = await registerUser('user1', 'User 1', 'Password123');
      const { cookie: cookie2 } = await registerUser('user2', 'User 2', 'Password123');

      const createRes = await authed('post', '/api/applications', cookie1).send({
        companyName: 'Private Corp',
        role: 'Dev',
      });
      const id = createRes.body.data.id;

      const res = await authed('put', `/api/applications/${id}`, cookie2).send({
        status: 'OFFER',
      });
      expect(res.status).toBe(404);
    });

    it('GET /api/applications?search= filters by company name', async () => {
      const { cookie } = await registerUser('searchuser', 'Search User', 'Password123');
      await authed('post', '/api/applications', cookie).send({
        companyName: 'Google',
        role: 'SWE',
      });
      await authed('post', '/api/applications', cookie).send({
        companyName: 'Meta',
        role: 'SWE',
      });

      const res = await authed('get', '/api/applications?search=goo', cookie);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].companyName).toBe('Google');
    });
  });

  describe('Stages API', () => {
    async function createAppWithStages(cookie: string[]) {
      const appRes = await authed('post', '/api/applications', cookie).send({
        companyName: 'Stage Corp',
        role: 'Dev',
      });
      const appId = appRes.body.data.id;
      return appId;
    }

    it('POST /api/applications/:id/stages adds a stage', async () => {
      const { cookie } = await registerUser('stageuser', 'Stage User', 'Password123');
      const appId = await createAppWithStages(cookie);

      const res = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'Phone Screen',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.label).toBe('Phone Screen');
      expect(res.body.data.order).toBe(0);
      expect(res.body.data.isCompleted).toBe(false);
    });

    it('stages update the next step on the application', async () => {
      const { cookie } = await registerUser('nextstep', 'Next Step', 'Password123');
      const appId = await createAppWithStages(cookie);

      await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'HR Screen',
      });
      await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'Technical',
      });

      let listRes = await authed('get', '/api/applications', cookie);
      expect(listRes.body.data[0].nextStep).toBe('HR Screen');

      // Toggle first stage as completed
      const stages = await authed('get', `/api/applications/${appId}/stages`, cookie);
      const firstStageId = stages.body.data[0].id;
      await authed('put', `/api/stages/${firstStageId}/toggle`, cookie);

      listRes = await authed('get', '/api/applications', cookie);
      expect(listRes.body.data[0].nextStep).toBe('Technical');
    });

    it('all stages completed shows Pending Decision', { timeout: 10000 }, async () => {
      const { cookie } = await registerUser('alldone', 'All Done', 'Password123');
      const appId = await createAppWithStages(cookie);

      const stageRes = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'Only Stage',
      });
      await authed('put', `/api/stages/${stageRes.body.data.id}/toggle`, cookie);

      const listRes = await authed('get', '/api/applications', cookie);
      expect(listRes.body.data[0].nextStep).toBe('Pending Decision');
    });

    it('PUT /api/stages/:id updates stage notes', async () => {
      const { cookie } = await registerUser('notesuser', 'Notes User', 'Password123');
      const appId = await createAppWithStages(cookie);

      const stageRes = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'Interview',
      });

      const res = await authed('put', `/api/stages/${stageRes.body.data.id}`, cookie).send({
        notes: '## Questions\n- Tell me about yourself',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('## Questions\n- Tell me about yourself');
    });

    it('PUT /api/stages/reorder reorders stages', async () => {
      const { cookie } = await registerUser('reorderuser', 'Reorder User', 'Password123');
      const appId = await createAppWithStages(cookie);

      const s1 = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'First',
      });
      const s2 = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'Second',
      });

      const res = await authed('put', '/api/stages/reorder', cookie).send({
        applicationId: appId,
        stageIds: [s2.body.data.id, s1.body.data.id],
      });

      expect(res.status).toBe(200);
      expect(res.body.data[0].label).toBe('Second');
      expect(res.body.data[1].label).toBe('First');
    });

    it('DELETE /api/stages/:id deletes a stage', async () => {
      const { cookie } = await registerUser('delstage', 'Del Stage', 'Password123');
      const appId = await createAppWithStages(cookie);

      const stageRes = await authed('post', `/api/applications/${appId}/stages`, cookie).send({
        label: 'To Delete',
      });

      const res = await authed('delete', `/api/stages/${stageRes.body.data.id}`, cookie);
      expect(res.status).toBe(200);

      const listRes = await authed('get', `/api/applications/${appId}/stages`, cookie);
      expect(listRes.body.data).toHaveLength(0);
    });
  });
});
