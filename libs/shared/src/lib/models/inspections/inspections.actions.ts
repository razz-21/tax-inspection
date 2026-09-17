import { z } from 'zod';
import {
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import { inspectionStatusSchema, type Inspection } from './inspections.model';

/** GET /inspections/:id — route params. */
export const getInspectionSchema = z.object({ id: z.string().min(1) });
export type GetInspection = z.infer<typeof getInspectionSchema>;

/** GET /inspections — pagination query plus inspection filters. */
export const getInspectionsSchema = paginationQuerySchema.extend({
  status: inspectionStatusSchema.optional(),
});
export type GetInspections = z.infer<typeof getInspectionsSchema>;

/** GET /inspections response — a paginated list of inspections. */
export type GetInspectionsResponse = Paginated<Inspection>;
