import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDashboardSchema } from '@tax-inspection/shared';
import { dashboardController } from './dashboard.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/dashboard` in app.ts. Requires a valid
 * `Authorization: Bearer <jwt>`.
 */
export const dashboardRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', getDashboardSchema), (c) =>
    dashboardController.get(c, c.req.valid('query')),
  );
