import { Hono } from 'hono';
import { inspectionsController } from './inspections.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — one entry per method/action, mapped to a controller function.
 * Mounted under `/api/inspections` in main.ts. All routes require a valid
 * `Authorization: Bearer <jwt>`.
 */
export const inspectionsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', inspectionsController.getAll)
  .get('/:id', inspectionsController.getById);
