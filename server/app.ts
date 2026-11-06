import dictionaries from './routes/dictionaries';
import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import versions from './routes/versions';
import reading from './routes/reading';
import connections from './routes/connections';
import search from './routes/search';
import { root } from './services/database';

/** Builds the HTTP application without opening a port, so integration tests can own their server. */
export async function createApp({ serveClient = true }: { serveClient?: boolean } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  for (const router of [versions, reading, connections, search, dictionaries]) {
    app.use('/api', router);
  }
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Ruta no encontrada' });
  });

  if (serveClient) {
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(root, 'dist')));
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({
        configFile: path.join(root, 'vite.config.ts'),
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    const message = error instanceof Error ? error.message : 'Solicitud no válida';
    response.status(400).json({ error: message });
  };
  app.use(handleError);
  return app;
}
