import 'dotenv/config';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '@workspace/utils';
import { getDatabaseUrl, createClient, checkHealth } from '@workspace/database';
import { authRouter } from './routes/auth.js';
import { workspaceRouter } from './routes/workspace.js';
import { itemsRouter } from './routes/items.js';
import { sharingRouter } from './routes/sharing.js';
import { userRouter } from './routes/user.js';
import { errorHandler } from './middleware/error.js';
import { csrfProtection, setCsrfCookie } from './middleware/csrf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3010;

// Trust the first proxy (Railway, nginx, etc.) so express-rate-limit
// reads the real client IP from X-Forwarded-For instead of the proxy IP.
app.set('trust proxy', 1);

// Database setup
const DB_NAME = 'finance_tracker_db';
const databaseUrl = process.env.DATABASE_URL ?? getDatabaseUrl(DB_NAME);
const prisma = createClient(databaseUrl);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    credentials: true,
  })
);

// Body parsing & cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection on state-changing requests
app.use(setCsrfCookie);
app.use(csrfProtection);

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const healthy = await checkHealth(prisma);
  res.status(healthy ? 200 : 503).json({ success: healthy, status: healthy ? 'ok' : 'unhealthy' });
});

// Routes (factory pattern -- each receives prisma instance)
app.use('/api/auth', authRouter(prisma));
app.use('/api/workspace', workspaceRouter(prisma));
app.use('/api/items', itemsRouter(prisma));
app.use('/api/user', userRouter(prisma));
app.use('/api', sharingRouter(prisma));

// Serve Vite build output with SPA fallback
const clientPath = join(__dirname, '..', '..', 'dist', 'client');
app.use(express.static(clientPath));

app.get('{*path}', (_req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Export for testing
export { app, prisma };

// Start server only if not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    log('info', 'finance-tracker', `Server running on http://localhost:${PORT}`);
  });
}
