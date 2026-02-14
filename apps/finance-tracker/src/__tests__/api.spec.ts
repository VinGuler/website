import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../server/index';

// Helper to register a user and extract the auth cookie
async function registerUser(
  username: string,
  displayName: string,
  password: string
): Promise<{ cookie: string[]; userId: number; workspaceId: number }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, displayName, password });
  const cookie = res.headers['set-cookie'] as unknown as string[];

  // Fetch the workspace ID for this user
  const wsRes = await request(app).get('/api/workspace').set('Cookie', cookie);
  return {
    cookie,
    userId: res.body.data.id,
    workspaceId: wsRes.body.data.workspace.id,
  };
}

// Clean DB before each test
beforeEach(async () => {
  await prisma.completedCycle.deleteMany();
  await prisma.item.deleteMany();
  await prisma.workspaceUser.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Finance Tracker API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/register creates user and returns cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', displayName: 'Test User', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.displayName).toBe('Test User');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/register with duplicate username returns 409', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', displayName: 'User 1', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', displayName: 'User 2', password: 'password456' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already taken');
    });

    it('POST /api/auth/login with valid creds returns cookie', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', displayName: 'Login User', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('loginuser');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'badpw', displayName: 'Bad PW', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'badpw', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me without cookie returns 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me with valid cookie returns user', async () => {
      const { cookie } = await registerUser('meuser', 'Me User', 'password123');

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('meuser');
    });

    it('POST /api/auth/logout clears cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Workspace', () => {
    it('GET /api/workspace returns user workspace with empty items', async () => {
      const { cookie } = await registerUser('wsuser', 'WS User', 'password123');

      const res = await request(app).get('/api/workspace').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace).toBeDefined();
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.permission).toBe('OWNER');
    });

    it('PUT /api/workspace/balance updates balance', async () => {
      const { cookie, workspaceId } = await registerUser('baluser', 'Bal User', 'password123');

      const res = await request(app)
        .put('/api/workspace/balance')
        .set('Cookie', cookie)
        .send({ workspaceId, balance: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/workspace');
      expect(res.status).toBe(401);
    });
  });

  describe('Items', () => {
    it('POST /api/items creates item', async () => {
      const { cookie, workspaceId } = await registerUser('itemuser', 'Item User', 'password123');

      const res = await request(app).post('/api/items').set('Cookie', cookie).send({
        workspaceId,
        type: 'INCOME',
        label: 'Salary',
        amount: 5000,
        dayOfMonth: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.label).toBe('Salary');
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.isPaid).toBe(false);
    });

    it('POST /api/items with invalid dayOfMonth returns 400', async () => {
      const { cookie, workspaceId } = await registerUser('badday', 'Bad Day', 'password123');

      const res = await request(app).post('/api/items').set('Cookie', cookie).send({
        workspaceId,
        type: 'INCOME',
        label: 'Salary',
        amount: 5000,
        dayOfMonth: 32,
      });

      expect(res.status).toBe(400);
    });

    it('PUT /api/items/:id updates item', async () => {
      const { cookie, workspaceId } = await registerUser('upitem', 'Up Item', 'password123');

      const createRes = await request(app).post('/api/items').set('Cookie', cookie).send({
        workspaceId,
        type: 'RENT',
        label: 'Old Rent',
        amount: 2000,
        dayOfMonth: 1,
      });

      const itemId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Cookie', cookie)
        .send({ label: 'New Rent', amount: 2500 });

      expect(res.status).toBe(200);
      expect(res.body.data.label).toBe('New Rent');
      expect(res.body.data.amount).toBe(2500);
    });

    it('PUT /api/items/:id toggles isPaid and adjusts balance', async () => {
      const { cookie, workspaceId } = await registerUser('paiduser', 'Paid User', 'password123');

      // Set initial balance
      await request(app)
        .put('/api/workspace/balance')
        .set('Cookie', cookie)
        .send({ workspaceId, balance: 1000 });

      // Create a payment item
      const createRes = await request(app).post('/api/items').set('Cookie', cookie).send({
        workspaceId,
        type: 'RENT',
        label: 'Rent',
        amount: 500,
        dayOfMonth: 1,
      });

      const itemId = createRes.body.data.id;

      // Mark as paid — balance should decrease by 500
      await request(app).put(`/api/items/${itemId}`).set('Cookie', cookie).send({ isPaid: true });

      const wsRes = await request(app).get('/api/workspace').set('Cookie', cookie);
      expect(Number(wsRes.body.data.workspace.balance)).toBe(500);
    });

    it('DELETE /api/items/:id removes item', async () => {
      const { cookie, workspaceId } = await registerUser('delitem', 'Del Item', 'password123');

      const createRes = await request(app).post('/api/items').set('Cookie', cookie).send({
        workspaceId,
        type: 'OTHER',
        label: 'Delete Me',
        amount: 100,
        dayOfMonth: 15,
      });

      const itemId = createRes.body.data.id;

      const res = await request(app).delete(`/api/items/${itemId}`).set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const wsRes = await request(app).get('/api/workspace').set('Cookie', cookie);
      expect(wsRes.body.data.items).toHaveLength(0);
    });
  });

  describe('Sharing', () => {
    it('GET /api/users/search finds user by username', async () => {
      const { cookie } = await registerUser('searcher', 'Searcher', 'password123');
      await registerUser('findme', 'Find Me', 'password123');

      const res = await request(app).get('/api/users/search?username=findme').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('findme');
    });

    it('POST /api/workspace/:id/members adds member', async () => {
      const owner = await registerUser('owner1', 'Owner', 'password123');
      const viewer = await registerUser('viewer1', 'Viewer', 'password123');

      const res = await request(app)
        .post(`/api/workspace/${owner.workspaceId}/members`)
        .set('Cookie', owner.cookie)
        .send({ userId: viewer.userId, permission: 'VIEWER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/workspace/:id/members/:userId removes member', async () => {
      const owner = await registerUser('owner2', 'Owner', 'password123');
      const viewer = await registerUser('viewer2', 'Viewer', 'password123');

      await request(app)
        .post(`/api/workspace/${owner.workspaceId}/members`)
        .set('Cookie', owner.cookie)
        .send({ userId: viewer.userId, permission: 'VIEWER' });

      const res = await request(app)
        .delete(`/api/workspace/${owner.workspaceId}/members/${viewer.userId}`)
        .set('Cookie', owner.cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('VIEWER cannot create items (403)', async () => {
      const owner = await registerUser('owner3', 'Owner', 'password123');
      const viewer = await registerUser('viewer3', 'Viewer', 'password123');

      await request(app)
        .post(`/api/workspace/${owner.workspaceId}/members`)
        .set('Cookie', owner.cookie)
        .send({ userId: viewer.userId, permission: 'VIEWER' });

      const res = await request(app).post('/api/items').set('Cookie', viewer.cookie).send({
        workspaceId: owner.workspaceId,
        type: 'INCOME',
        label: 'Should Fail',
        amount: 1000,
        dayOfMonth: 10,
      });

      expect(res.status).toBe(403);
    });
  });
});
