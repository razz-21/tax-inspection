import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import {
  API_PREFIX,
  DEFAULT_API_PORT,
  nowIso,
  type HealthCheck,
} from '@tax-inspection/shared';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { getPort } from './utils/env';
import { inspectionsRoutes } from './api/inspections/inspections.routes';

const app = new Hono();

// --- middleware ---
app.use('*', logger());
app.use('*', requestId);
app.use(`${API_PREFIX}/*`, cors());
app.onError(errorHandler);

// --- root & health ---
app.get('/', (c) => c.text('tax-inspection API — powered by Hono'));

app.get(`${API_PREFIX}/health`, (c) => {
  const body: HealthCheck = {
    status: 'ok',
    service: 'inspector-api',
    timestamp: nowIso(),
  };
  return c.json(body);
});

app.get(`${API_PREFIX}/hello`, (c) => {
  const name = c.req.query('name') ?? 'world';
  return c.json({ message: `Hello, ${name}!` });
});

// --- entity APIs ---
app.route(`${API_PREFIX}/inspections`, inspectionsRoutes);

const port = getPort(DEFAULT_API_PORT);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🔥 Hono server listening on http://localhost:${info.port}`);
});

export default app;
