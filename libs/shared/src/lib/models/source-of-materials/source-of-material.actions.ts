import { z } from 'zod';
import { sourceOfMaterialSchema, type SourceOfMaterial } from './source-of-material.model';

/** GET /source-of-materials response — the full list of material sources. */
export const getSourceOfMaterialsResponseSchema = z.array(sourceOfMaterialSchema);
export type GetSourceOfMaterialsResponse = SourceOfMaterial[];

/**
 * POST /source-of-materials — create body. The server generates `id` and sets
 * `created_by` from the authenticated user.
 */
export const postSourceOfMaterialSchema = sourceOfMaterialSchema.omit({
  id: true,
  created_by: true,
});
export type PostSourceOfMaterial = z.infer<typeof postSourceOfMaterialSchema>;

/** PATCH /source-of-materials/:id — partial update. `id` comes from the route. */
export const patchSourceOfMaterialSchema = postSourceOfMaterialSchema.partial();
export type PatchSourceOfMaterial = z.infer<typeof patchSourceOfMaterialSchema>;

/** Route params for GET/PATCH/DELETE /source-of-materials/:id. */
export const sourceOfMaterialParamsSchema = z.object({ id: z.uuid() });
export type SourceOfMaterialParams = z.infer<typeof sourceOfMaterialParamsSchema>;
