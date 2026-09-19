import { z } from 'zod';

/** Peso penalty charged per 1 unit (m³) of excess volume. */
export const DEFAULT_PENALTY_RATE = 560;

/**
 * A tax assessment computed for a delivery. `excess_volume` is the total
 * over-volume across the delivery's inspections; `computed_tax` is
 * `excess_volume * penalty_rate`.
 */
export const taxAssessmentSchema = z.object({
  id: z.uuid(),
  /** FK to the assessed delivery. */
  delivery_id: z.uuid(),
  excess_volume: z.coerce.number().nonnegative(),
  penalty_rate: z.coerce.number().nonnegative(),
  computed_tax: z.coerce.number().nonnegative(),
  /** Date the assessment was made (yyyy-mm-dd). */
  assessed_date: z.string().min(1),
  /** FK to the user who ran the assessment (set server-side from the token). */
  assessed_by: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type TaxAssessment = z.infer<typeof taxAssessmentSchema>;
