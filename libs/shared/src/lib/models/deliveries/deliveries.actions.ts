import { z } from 'zod';
import {
  paginatedSchema,
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import {
  deliverySchema,
  materialTypeSchema,
  truckTypeSchema,
  type Delivery,
} from './deliveries.model';

/**
 * POST /deliveries — create body. The server generates `id` (a UUID), sets
 * `created_by` from the authenticated user, and the `createdAt`/`updatedAt`
 * timestamps.
 */
export const postDeliverySchema = deliverySchema.omit({
  id: true,
  created_by: true,
  creator: true,
  is_new: true,
  // Status is assigned server-side ("In Review") on creation.
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type PostDelivery = z.infer<typeof postDeliverySchema>;

/** PATCH /deliveries/:id — partial update. `id` comes from the route. */
export const patchDeliverySchema = deliverySchema
  .omit({
    id: true,
    created_by: true,
    creator: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();
export type PatchDelivery = z.infer<typeof patchDeliverySchema>;

/** GET /deliveries/:id — route params. */
export const getDeliverySchema = z.object({ id: z.uuid() });
export type GetDelivery = z.infer<typeof getDeliverySchema>;

/** DELETE /deliveries/:id — route params. */
export const deleteDeliverySchema = z.object({ id: z.uuid() });
export type DeleteDelivery = z.infer<typeof deleteDeliverySchema>;

/** GET /deliveries — pagination query plus delivery filters. */
export const getDeliveriesSchema = paginationQuerySchema.extend({
  truck_type: truckTypeSchema.optional(),
  material_type: materialTypeSchema.optional(),
});
export type GetDeliveries = z.infer<typeof getDeliveriesSchema>;

/** GET /deliveries response — a paginated list of deliveries. */
export const getDeliveriesResponseSchema = paginatedSchema(deliverySchema);
export type GetDeliveriesResponse = Paginated<Delivery>;
