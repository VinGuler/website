import 'dotenv/config';
import express, { type Express } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '@workspace/utils';
import { getDatabaseUrl, createClient, checkHealth } from '@workspace/database';
import { PrismaClient } from '../generated/prisma/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Database setup
const DB_NAME = 'client_server_database_db';
const databaseUrl = process.env.DATABASE_URL ?? getDatabaseUrl(DB_NAME);
const prisma = createClient(databaseUrl, PrismaClient);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const healthy = await checkHealth(prisma);
  res.status(healthy ? 200 : 503).json({ success: healthy, status: healthy ? 'ok' : 'unhealthy' });
});

// API routes
app.get('/api/todos', async (_req, res) => {
  try {
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  try {
    const todo = await prisma.todo.create({ data: { text } });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { completed } = req.body;

  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: typeof completed === 'boolean' ? { completed } : {},
    });
    res.json({ success: true, data: todo });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.todo.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Serve Vite build output with SPA fallback
const clientPath = join(__dirname, '..', '..', 'dist', 'client');
app.use(express.static(clientPath));

app.get('{*path}', (req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// Export for testing
export { app, prisma };

// Start server only if not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    log('info', 'client-server-database', `Server running on http://localhost:${PORT}`);
    log(
      'info',
      'client-server-database',
      `Open your browser to http://localhost:${PORT} to get started`
    );
  });
}
