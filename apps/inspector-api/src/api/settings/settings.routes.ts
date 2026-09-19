import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { patchSettingsSchema } from '@tax-inspection/shared';
import { settingsController } from './settings.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/settings` in app.ts. Requires a valid
 * `Authorization: Bearer <jwt>`.
 */
export const settingsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', (c) => settingsController.get(c))
  .patch('/', zValidator('json', patchSettingsSchema), (c) =>
    settingsController.update(c, c.req.valid('json')),
  );
