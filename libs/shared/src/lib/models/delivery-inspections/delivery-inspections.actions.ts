import { z } from 'zod';
import {
  paginatedSchema,
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import {
  deliveryInspectionSchema,
  type DeliveryInspection,
} from './delivery-inspections.model';

/**
 * POST /delivery-inspections — create body. The server generates `id` (a UUID),
 * sets `user_id` from the authenticated user, and the `createdAt` timestamp.
 * `delivery_id` identifies the delivery being inspected.
 */
export const postDeliveryInspectionSchema = deliveryInspectionSchema.omit({
  id: true,
  user_id: true,
  inspector: true,
  createdAt: true,
});
export type PostDeliveryInspection = z.infer<
  typeof postDeliveryInspectionSchema
>;

/** GET /delivery-inspections/:id — route params. */
export const getDeliveryInspectionSchema = z.object({ id: z.uuid() });
export type GetDeliveryInspection = z.infer<
  typeof getDeliveryInspectionSchema
>;

/** DELETE /delivery-inspections/:id — route params. */
export const deleteDeliveryInspectionSchema = z.object({ id: z.uuid() });
export type DeleteDeliveryInspection = z.infer<
  typeof deleteDeliveryInspectionSchema
>;

/** GET /delivery-inspections — pagination query plus a `delivery_id` filter. */
export const getDeliveryInspectionsSchema = paginationQuerySchema.extend({
  delivery_id: z.uuid().optional(),
});
export type GetDeliveryInspections = z.infer<
  typeof getDeliveryInspectionsSchema
>;

/** GET /delivery-inspections response — a paginated list of inspections. */
export const getDeliveryInspectionsResponseSchema = paginatedSchema(
  deliveryInspectionSchema,
);
export type GetDeliveryInspectionsResponse = Paginated<DeliveryInspection>;
