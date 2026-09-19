import { z } from 'zod';

/**
 * A source of materials — a reference/lookup record describing where delivered
 * materials originate. `id` is a UUID (maps to Mongo `_id`). `created_by` is a
 * foreign key to the user who created the record.
 */
export const sourceOfMaterialSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().default(''),
  /** FK to the user who created the record (set server-side from token). */
  created_by: z.uuid(),
});
export type SourceOfMaterial = z.infer<typeof sourceOfMaterialSchema>;
