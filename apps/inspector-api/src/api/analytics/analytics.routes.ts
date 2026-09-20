import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getAnalyticsSchema } from '@tax-inspection/shared';
import { analyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/analytics` in app.ts. Requires a valid
 * `Authorization: Bearer <jwt>`.
 */
export const analyticsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', getAnalyticsSchema), (c) =>
    analyticsController.get(c, c.req.valid('query')),
  );
