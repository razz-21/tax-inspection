import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import {
  API_PREFIX,
  nowIso,
  type HealthCheck,
} from '@tax-inspection/shared';
import { env } from './config/env';
import { closeDatabase, connectToDatabase } from './config/database';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { inspectionsRoutes } from './api/inspections/inspections.routes';
import { usersRoutes } from './api/users/users.routes';
import { deliveriesRoutes } from './api/deliveries/deliveries.routes';
import { deliveryInspectionsRoutes } from './api/delivery-inspections/delivery-inspections.routes';
import { taxAssessmentsRoutes } from './api/tax-assessments/tax-assessments.routes';
import { paymentsRoutes } from './api/payments/payments.routes';

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
app.route(`${API_PREFIX}/users`, usersRoutes);
app.route(`${API_PREFIX}/deliveries`, deliveriesRoutes);
app.route(`${API_PREFIX}/delivery-inspections`, deliveryInspectionsRoutes);
app.route(`${API_PREFIX}/tax-assessments`, taxAssessmentsRoutes);
app.route(`${API_PREFIX}/payments`, paymentsRoutes);

async function bootstrap() {
  await connectToDatabase();

  const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`🔥 Hono server listening on http://localhost:${info.port}`);
  });

  const shutdown = async () => {
    server.close();
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
