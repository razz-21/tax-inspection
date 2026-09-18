import type { Context } from 'hono';
import type {
  AccessTokenClaims,
  DeleteDeliveryInspection,
  GetDeliveryInspection,
  GetDeliveryInspections,
  PostDeliveryInspection,
} from '@tax-inspection/shared';
import { deliveryInspectionsService } from './delivery-inspections.service';

export const deliveryInspectionsController = {
  async getAll(c: Context, query: GetDeliveryInspections) {
    return c.json(await deliveryInspectionsService.list(query));
  },

  async getById(c: Context, params: GetDeliveryInspection) {
    const inspection = await deliveryInspectionsService.findById(params.id);
    if (!inspection) {
      return c.json({ error: `Inspection ${params.id} not found` }, 404);
    }
    return c.json(inspection);
  },

  async create(c: Context, body: PostDeliveryInspection) {
    // Set by requireAuth from the verified access token.
    const claims = c.get('user') as AccessTokenClaims | undefined;
    if (!claims?.sub) {
      return c.json({ error: 'Unauthenticated' }, 401);
    }
    const inspection = await deliveryInspectionsService.create(body, claims.sub);
    return c.json(inspection, 201);
  },

  async remove(c: Context, params: DeleteDeliveryInspection) {
    const deleted = await deliveryInspectionsService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `Inspection ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
