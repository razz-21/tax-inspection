import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  patchSourceOfMaterialSchema,
  postSourceOfMaterialSchema,
  sourceOfMaterialParamsSchema,
} from '@tax-inspection/shared';
import { sourceOfMaterialsController } from './source-of-materials.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/source-of-materials` in app.ts. All routes
 * require a valid `Authorization: Bearer <jwt>`.
 */
export const sourceOfMaterialsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', (c) => sourceOfMaterialsController.getAll(c))
  .post('/', zValidator('json', postSourceOfMaterialSchema), (c) =>
    sourceOfMaterialsController.create(c, c.req.valid('json')),
  )
  .patch(
    '/:id',
    zValidator('param', sourceOfMaterialParamsSchema),
    zValidator('json', patchSourceOfMaterialSchema),
    (c) =>
      sourceOfMaterialsController.update(
        c,
        c.req.valid('param'),
        c.req.valid('json'),
      ),
  )
  .delete('/:id', zValidator('param', sourceOfMaterialParamsSchema), (c) =>
    sourceOfMaterialsController.remove(c, c.req.valid('param')),
  );
