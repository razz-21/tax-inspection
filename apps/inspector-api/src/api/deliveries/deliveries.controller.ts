import type { Context } from 'hono';
import type {
  DeleteDelivery,
  GetDeliveries,
  GetDelivery,
  PatchDelivery,
  PostDelivery,
} from '@tax-inspection/shared';
import { deliveriesService } from './deliveries.service';

export const deliveriesController = {
  async getAll(c: Context, query: GetDeliveries) {
    return c.json(await deliveriesService.list(query));
  },

  async getById(c: Context, params: GetDelivery) {
    const delivery = await deliveriesService.findById(params.id);
    if (!delivery) {
      return c.json({ error: `Delivery ${params.id} not found` }, 404);
    }
    return c.json(delivery);
  },

  async create(c: Context, body: PostDelivery) {
    const delivery = await deliveriesService.create(body);
    return c.json(delivery, 201);
  },

  async update(c: Context, params: GetDelivery, body: PatchDelivery) {
    const delivery = await deliveriesService.update(params.id, body);
    if (!delivery) {
      return c.json({ error: `Delivery ${params.id} not found` }, 404);
    }
    return c.json(delivery);
  },

  async remove(c: Context, params: DeleteDelivery) {
    const deleted = await deliveriesService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `Delivery ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
