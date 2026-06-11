import express from 'express';
import { config } from './config/env.js';
import { connectDb } from './config/db.js';
import { corsMiddleware, apiRateLimiter } from './middleware/security.js';
import { ensureStorage, getBucketDir, BUCKETS } from './services/storage.js';
import uploadRoutes from './routes/upload.js';
import webhookRoutes from './routes/webhooks.js';
import assetRoutes from './routes/assets.js';

async function start() {
  await ensureStorage();
  await connectDb();

  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());

  // Health check.
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Serve the PUBLIC mock-S3 bucket ("ar-web-assets") at /assets.
  app.use('/assets', express.static(getBucketDir(BUCKETS.AR_WEB_ASSETS)));

  // API routes (rate limited).
  app.use('/api', apiRateLimiter);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/assets', assetRoutes);

  // 404 for unmatched API routes.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[error]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  });

  app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
