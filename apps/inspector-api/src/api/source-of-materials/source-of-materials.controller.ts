import type { Context } from 'hono';
import type {
  AccessTokenClaims,
  PatchSourceOfMaterial,
  PostSourceOfMaterial,
  SourceOfMaterialParams,
} from '@tax-inspection/shared';
import { sourceOfMaterialsService } from './source-of-materials.service';

export const sourceOfMaterialsController = {
  async getAll(c: Context) {
    return c.json(await sourceOfMaterialsService.list());
  },

  async create(c: Context, body: PostSourceOfMaterial) {
    // Set by requireAuth from the verified access token.
    const claims = c.get('user') as AccessTokenClaims | undefined;
    if (!claims?.sub) {
      return c.json({ error: 'Unauthenticated' }, 401);
    }
    const created = await sourceOfMaterialsService.create(body, claims.sub);
    return c.json(created, 201);
  },

  async update(
    c: Context,
    params: SourceOfMaterialParams,
    body: PatchSourceOfMaterial,
  ) {
    const updated = await sourceOfMaterialsService.update(params.id, body);
    if (!updated) {
      return c.json({ error: `Source of materials ${params.id} not found` }, 404);
    }
    return c.json(updated);
  },

  async remove(c: Context, params: SourceOfMaterialParams) {
    const deleted = await sourceOfMaterialsService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `Source of materials ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
