import { z } from 'zod';
import {
  paginatedSchema,
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import {
  taxAssessmentSchema,
  type TaxAssessment,
} from './tax-assessment.model';

/**
 * POST /tax-assessments/calculate — compute and persist a tax assessment for a
 * delivery. The server sums the excess volume across the delivery's
 * inspections and multiplies by the penalty rate. `assessed_by`,
 * `assessed_date`, and timestamps are set server-side.
 */
export const calculateTaxSchema = z.object({ delivery_id: z.uuid() });
export type CalculateTax = z.infer<typeof calculateTaxSchema>;

/** DELETE /tax-assessments/:id — route params. */
export const deleteTaxAssessmentSchema = z.object({ id: z.uuid() });
export type DeleteTaxAssessment = z.infer<typeof deleteTaxAssessmentSchema>;

/** GET /tax-assessments — pagination query plus a `delivery_id` filter. */
export const getTaxAssessmentsSchema = paginationQuerySchema.extend({
  delivery_id: z.uuid().optional(),
});
export type GetTaxAssessments = z.infer<typeof getTaxAssessmentsSchema>;

/** GET /tax-assessments response — a paginated list of assessments. */
export const getTaxAssessmentsResponseSchema =
  paginatedSchema(taxAssessmentSchema);
export type GetTaxAssessmentsResponse = Paginated<TaxAssessment>;
