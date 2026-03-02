import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../server/index';

// Mock global fetch so the email service (inside @workspace/login) never calls
// the Resend API or real SMTP during tests.
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));

const CSRF_TOKEN = 'test-csrf-token';
const CSRF_COOKIE = `app_csrf=${CSRF_TOKEN}`;

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

/** Shorthand for POST/PUT/DELETE with CSRF headers */
function postWithCsrf(url: string) {
  return request(app).post(url).set('Cookie', CSRF_COOKIE).set('x-csrf-token', CSRF_TOKEN);
}

function putWithCsrf(url: string) {
  return request(app).put(url).set('Cookie', CSRF_COOKIE).set('x-csrf-token', CSRF_TOKEN);
}

function deleteWithCsrf(url: string) {
  return request(app).delete(url).set('Cookie', CSRF_COOKIE).set('x-csrf-token', CSRF_TOKEN);
}

// Clean DB before each test
beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Client-Server-Database API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ok');
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
      expect(res.body.data.displayName).toBe('Test User');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/register without email returns 400', async () => {
      const res = await postWithCsrf('/api/auth/register').send({
        username: 'noemail',
        displayName: 'No Email',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('POST /api/auth/register with weak password returns 400', async () => {
      const res = await postWithCsrf('/api/auth/register').send({
        username: 'weakpw',
        displayName: 'Weak PW',
        password: 'simple',
        email: 'weak@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/8 characters/);
    });

    it('POST /api/auth/register with duplicate username returns 409', async () => {
      await postWithCsrf('/api/auth/register').send({
        username: 'dupuser',
        displayName: 'User 1',
        password: 'Password123',
        email: 'dup1@example.com',
      });

      const res = await postWithCsrf('/api/auth/register').send({
        username: 'dupuser',
        displayName: 'User 2',
        password: 'Password456',
        email: 'dup2@example.com',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already taken');
    });

    it('POST /api/auth/login with valid creds returns cookie', async () => {
      await postWithCsrf('/api/auth/register').send({
        username: 'loginuser',
        displayName: 'Login User',
        password: 'Password123',
        email: 'login@example.com',
      });

      const res = await postWithCsrf('/api/auth/login').send({
        username: 'loginuser',
        password: 'Password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('loginuser');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
      await postWithCsrf('/api/auth/register').send({
        username: 'badpw',
        displayName: 'Bad PW',
        password: 'Password123',
        email: 'badpw@example.com',
      });

      const res = await postWithCsrf('/api/auth/login').send({
        username: 'badpw',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me without cookie returns 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me with valid cookie returns user', async () => {
      const { cookie } = await registerUser('meuser', 'Me User', 'Password123');

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('meuser');
    });

    it('POST /api/auth/logout clears cookie and invalidates token', async () => {
      const { cookie } = await registerUser('logoutuser', 'Logout User', 'Password123');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Todo API (authenticated)', () => {
    it('GET /api/todos without auth returns 401', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(401);
    });

    it('GET /api/todos returns empty list when no todos exist', async () => {
      const { cookie } = await registerUser('todouser', 'Todo User', 'Password123');

      const response = await request(app).get('/api/todos').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('GET /api/todos returns list of todos', async () => {
      const { cookie } = await registerUser('todouser2', 'Todo User 2', 'Password123');
      await prisma.todo.create({ data: { text: 'Seeded todo' } });

      const response = await request(app).get('/api/todos').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].text).toBe('Seeded todo');
    });

    it('GET /api/todos returns todos ordered by creation time', async () => {
      const { cookie } = await registerUser('todouser3', 'Todo User 3', 'Password123');
      await prisma.todo.create({ data: { text: 'First' } });
      await prisma.todo.create({ data: { text: 'Second' } });

      const response = await request(app).get('/api/todos').set('Cookie', cookie);

      expect(response.body.data[0].text).toBe('First');
      expect(response.body.data[1].text).toBe('Second');
    });

    it('POST /api/todos creates a new todo', async () => {
      const { cookie } = await registerUser('todouser4', 'Todo User 4', 'Password123');

      const response = await request(app)
        .post('/api/todos')
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN)
        .send({ text: 'Test todo' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.text).toBe('Test todo');
      expect(response.body.data.completed).toBe(false);
    });

    it('POST /api/todos returns error when text is missing', async () => {
      const { cookie } = await registerUser('todouser5', 'Todo User 5', 'Password123');

      const response = await request(app)
        .post('/api/todos')
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Text is required');
    });

    it('PUT /api/todos/:id updates todo completion status', async () => {
      const { cookie } = await registerUser('todouser6', 'Todo User 6', 'Password123');
      const todo = await prisma.todo.create({ data: { text: 'Toggle me' } });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(true);
    });

    it('PUT /api/todos/:id returns error for non-existent todo', async () => {
      const { cookie } = await registerUser('todouser7', 'Todo User 7', 'Password123');

      const response = await request(app)
        .put('/api/todos/99999')
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN)
        .send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Todo not found');
    });

    it('DELETE /api/todos/:id deletes a todo', async () => {
      const { cookie } = await registerUser('todouser8', 'Todo User 8', 'Password123');
      const todo = await prisma.todo.create({ data: { text: 'Delete me' } });

      const response = await request(app)
        .delete(`/api/todos/${todo.id}`)
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/todos/:id returns error for non-existent todo', async () => {
      const { cookie } = await registerUser('todouser9', 'Todo User 9', 'Password123');

      const response = await request(app)
        .delete('/api/todos/99999')
        .set('Cookie', cookie)
        .set('x-csrf-token', CSRF_TOKEN);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Todo not found');
    });
  });
});
