import express, { type Express } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '@website/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
const todos: { id: number; text: string; completed: boolean }[] = [
  { id: 1, text: 'Learn TypeScript', completed: true },
  { id: 2, text: 'Build a full-stack app', completed: false },
];
let nextId = 3;

// API routes
app.get('/api/todos', (req, res) => {
  res.json({ success: true, data: todos });
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  const newTodo = {
    id: nextId++,
    text,
    completed: false,
  };
  todos.push(newTodo);
  res.json({ success: true, data: newTodo });
});

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { completed } = req.body;

  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ success: false, error: 'Todo not found' });
  }

  if (typeof completed === 'boolean') {
    todo.completed = completed;
  }
  res.json({ success: true, data: todo });
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.json({ success: true });
});

// Serve static files from public directory
const publicPath = join(__dirname, '..', '..', 'public');
app.use(express.static(publicPath));

// Serve client files (compiled JavaScript from dist/client)
const clientPath = join(__dirname, '..', '..', 'dist', 'client');
app.use('/client', express.static(clientPath));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// Export app for testing
export { app };

// Start server only if not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    log('info', 'client-server', `Server running on http://localhost:${PORT}`);
    log('info', 'client-server', `Open your browser to http://localhost:${PORT} to get started`);
  });
}
