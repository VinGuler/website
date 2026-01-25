import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// In production, __dirname is dist/, in dev it's src/
// Static files are always in dist/public (built by client)
const publicPath = path.join(__dirname, 'public');
const hasPublicDir = fs.existsSync(publicPath);

if (hasPublicDir) {
  // Serve static files from the client build
  app.use(express.static(publicPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  // Dev mode without built client - just show a message
  app.get('/', (_req, res) => {
    res.send('Server is running. Run "npm run build:client" to serve the client.');
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };
