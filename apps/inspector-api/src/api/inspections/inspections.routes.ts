import { Hono } from 'hono';
import { inspectionsController } from './inspections.controller';

/**
 * Routes — one entry per method/action, mapped to a controller function.
 * Mounted under `/api/inspections` in main.ts.
 */
export const inspectionsRoutes = new Hono()
  .get('/', inspectionsController.getAll)
  .get('/:id', inspectionsController.getById);
