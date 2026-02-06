import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';

describe('Todo API', () => {
  describe('GET /api/todos', () => {
    it('should return list of todos', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const newTodo = { text: 'Test todo' };
      const response = await request(app).post('/api/todos').send(newTodo);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.text).toBe('Test todo');
      expect(response.body.data.completed).toBe(false);
    });

    it('should return error when text is missing', async () => {
      const response = await request(app).post('/api/todos').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Text is required');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update todo completion status', async () => {
      // First get the todos to get a valid ID
      const todosResponse = await request(app).get('/api/todos');
      const firstTodo = todosResponse.body.data[0];

      const response = await request(app)
        .put(`/api/todos/${firstTodo.id}`)
        .send({ completed: !firstTodo.completed });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(!firstTodo.completed);
    });

    it('should return error for non-existent todo', async () => {
      const response = await request(app).put('/api/todos/99999').send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Todo not found');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      // First create a todo to delete
      const createResponse = await request(app).post('/api/todos').send({ text: 'Todo to delete' });

      const todoId = createResponse.body.data.id;

      const response = await request(app).delete(`/api/todos/${todoId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app).get('/api/todos');
      const deletedTodo = getResponse.body.data.find((t: any) => t.id === todoId);
      expect(deletedTodo).toBeUndefined();
    });

    it('should return error for non-existent todo', async () => {
      const response = await request(app).delete('/api/todos/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Todo not found');
    });
  });
});
