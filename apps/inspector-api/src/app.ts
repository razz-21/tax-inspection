import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { API_PREFIX, nowIso, type HealthCheck } from '@tax-inspection/shared';
import { connectToDatabase } from './config/database';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { inspectionsRoutes } from './api/inspections/inspections.routes';
import { usersRoutes } from './api/users/users.routes';
import { deliveriesRoutes } from './api/deliveries/deliveries.routes';
import { deliveryInspectionsRoutes } from './api/delivery-inspections/delivery-inspections.routes';
import { taxAssessmentsRoutes } from './api/tax-assessments/tax-assessments.routes';
import { paymentsRoutes } from './api/payments/payments.routes';
import { sourceOfMaterialsRoutes } from './api/source-of-materials/source-of-materials.routes';
import { dashboardRoutes } from './api/dashboard/dashboard.routes';
import { analyticsRoutes } from './api/analytics/analytics.routes';
import { settingsRoutes } from './api/settings/settings.routes';
import { reportsRoutes } from './api/reports/reports.routes';

const app = new Hono();

// Ensure the database is connected before handling any request. `connectToDatabase`
// is idempotent and caches the client, so this is a no-op on warm invocations —
// which is what makes the app safe to run in a serverless environment (Vercel).
app.use('*', async (_c, next) => {
  await connectToDatabase();
  await next();
});

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
app.route(`${API_PREFIX}/source-of-materials`, sourceOfMaterialsRoutes);
app.route(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.route(`${API_PREFIX}/analytics`, analyticsRoutes);
app.route(`${API_PREFIX}/settings`, settingsRoutes);
app.route(`${API_PREFIX}/reports`, reportsRoutes);

export default app;
