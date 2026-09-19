import { z } from 'zod';
import { userRoleSchema } from '../users/users.model';

/**
 * Resolved snapshot of the user who recorded an inspection — attached to query
 * responses so clients can show the inspector without a second lookup.
 */
export const inspectorSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: userRoleSchema,
});
export type Inspector = z.infer<typeof inspectorSchema>;

/**
 * A single inspection recorded against a delivery. `id` is a UUID (maps to
 * Mongo `_id`). `delivery_id` and `user_id` are foreign keys to the delivery
 * being inspected and the user who recorded it (set server-side from the token).
 */
export const deliveryInspectionSchema = z.object({
  id: z.uuid(),
  /** FK to the delivery being inspected. */
  delivery_id: z.uuid(),
  /** FK to the user who recorded the inspection (set server-side from token). */
  user_id: z.uuid(),
  /** Resolved `user_id` (id/name/role); populated on query. */
  inspector: inspectorSchema.nullable().default(null),
  inspection_date: z.string().min(1),
  actual_volume: z.coerce.number().nonnegative(),
  allowed_volume: z.coerce.number().nonnegative(),
  remarks: z.string().default(''),
  createdAt: z.iso.datetime(),
});
export type DeliveryInspection = z.infer<typeof deliveryInspectionSchema>;
