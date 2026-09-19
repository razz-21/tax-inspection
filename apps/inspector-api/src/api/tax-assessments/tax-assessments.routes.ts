import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  calculateTaxSchema,
  deleteTaxAssessmentSchema,
  getTaxAssessmentsSchema,
} from '@tax-inspection/shared';
import { taxAssessmentsController } from './tax-assessments.controller';
import { requireAuth } from '../../middleware/auth';

/**
 * Routes — mounted under `/api/tax-assessments` in main.ts. All routes require
 * a valid `Authorization: Bearer <jwt>`.
 */
export const taxAssessmentsRoutes = new Hono()
  .use('*', requireAuth)
  .post('/calculate', zValidator('json', calculateTaxSchema), (c) =>
    taxAssessmentsController.calculate(c, c.req.valid('json')),
  )
  .get('/', zValidator('query', getTaxAssessmentsSchema), (c) =>
    taxAssessmentsController.getAll(c, c.req.valid('query')),
  )
  .delete('/:id', zValidator('param', deleteTaxAssessmentSchema), (c) =>
    taxAssessmentsController.remove(c, c.req.valid('param')),
  );
