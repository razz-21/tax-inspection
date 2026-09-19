import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getReportSchema } from '@tax-inspection/shared';
import { reportsController } from './reports.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/reports` in app.ts. Requires a valid
 * `Authorization: Bearer <jwt>`.
 */
export const reportsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', getReportSchema), (c) =>
    reportsController.get(c, c.req.valid('query')),
  );
