import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  deleteDeliverySchema,
  getDeliveriesSchema,
  getDeliverySchema,
  patchDeliverySchema,
  postDeliverySchema,
} from '@tax-inspection/shared';
import { deliveriesController } from './deliveries.controller';
import { requireAuth } from '../../middleware/auth';

export const deliveriesRoutes = new Hono()
  // All delivery routes require a valid `Authorization: Bearer <jwt>`.
  .use('*', requireAuth)
  .get('/', zValidator('query', getDeliveriesSchema), (c) =>
    deliveriesController.getAll(c, c.req.valid('query')),
  )
  .post('/', zValidator('json', postDeliverySchema), (c) =>
    deliveriesController.create(c, c.req.valid('json')),
  )
  .get('/:id', zValidator('param', getDeliverySchema), (c) =>
    deliveriesController.getById(c, c.req.valid('param')),
  )
  .patch(
    '/:id',
    zValidator('param', getDeliverySchema),
    zValidator('json', patchDeliverySchema),
    (c) =>
      deliveriesController.update(c, c.req.valid('param'), c.req.valid('json')),
  )
  .delete('/:id', zValidator('param', deleteDeliverySchema), (c) =>
    deliveriesController.remove(c, c.req.valid('param')),
  );
