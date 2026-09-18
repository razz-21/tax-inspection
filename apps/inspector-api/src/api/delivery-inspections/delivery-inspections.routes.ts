import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  deleteDeliveryInspectionSchema,
  getDeliveryInspectionSchema,
  getDeliveryInspectionsSchema,
  postDeliveryInspectionSchema,
} from '@tax-inspection/shared';
import { deliveryInspectionsController } from './delivery-inspections.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/delivery-inspections` in main.ts. All routes
 * require a valid `Authorization: Bearer <jwt>`.
 */
export const deliveryInspectionsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', getDeliveryInspectionsSchema), (c) =>
    deliveryInspectionsController.getAll(c, c.req.valid('query')),
  )
  .post('/', zValidator('json', postDeliveryInspectionSchema), (c) =>
    deliveryInspectionsController.create(c, c.req.valid('json')),
  )
  .get('/:id', zValidator('param', getDeliveryInspectionSchema), (c) =>
    deliveryInspectionsController.getById(c, c.req.valid('param')),
  )
  .delete('/:id', zValidator('param', deleteDeliveryInspectionSchema), (c) =>
    deliveryInspectionsController.remove(c, c.req.valid('param')),
  );
