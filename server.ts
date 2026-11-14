/**
 * Server entry point for Neighborhood Help Exchange
 * Express server running on port 3000 with Vite middleware in development
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPort(): number {
  // Check CLI arguments (--port 3000 or --port=3000)
  const portEqArg = process.argv.find(arg => arg.startsWith('--port='));
  if (portEqArg) {
    const parsed = parseInt(portEqArg.split('=')[1], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  // In development, AI Studio dev server must always bind to port 3000
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
}

async function startServer() {
  const app = express();
  const PORT = getPort();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint (registered before API router for instant response)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Neighborhood Help Exchange',
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  let viteServer: Awaited<ReturnType<typeof import('vite').createServer>> | null = null;

  if (!isProduction) {
    // Initialize Vite middleware in the background so Express binds port 3000 immediately
    const vitePromise = (async () => {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
          watch: { ignored: ['**/*'] },
        },
        appType: 'spa',
      });
      viteServer = vite;
      return vite;
    })();

    vitePromise.catch(err => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = viteServer ?? (await vitePromise);
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    // Production mode: serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Neighborhood Help Exchange server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    if (viteServer) {
      await viteServer.close().catch(() => {});
    }
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

