import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  deletePaymentSchema,
  getPaymentSchema,
  getPaymentsSchema,
  patchPaymentSchema,
  postPaymentSchema,
} from '@tax-inspection/shared';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/payments` in main.ts. All routes require a
 * valid `Authorization: Bearer <jwt>`.
 */
export const paymentsRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', getPaymentsSchema), (c) =>
    paymentsController.getAll(c, c.req.valid('query')),
  )
  .post('/', zValidator('json', postPaymentSchema), (c) =>
    paymentsController.create(c, c.req.valid('json')),
  )
  .get('/:id', zValidator('param', getPaymentSchema), (c) =>
    paymentsController.getById(c, c.req.valid('param')),
  )
  .patch(
    '/:id',
    zValidator('param', getPaymentSchema),
    zValidator('json', patchPaymentSchema),
    (c) => paymentsController.update(c, c.req.valid('param'), c.req.valid('json')),
  )
  .delete('/:id', zValidator('param', deletePaymentSchema), (c) =>
    paymentsController.remove(c, c.req.valid('param')),
  );
