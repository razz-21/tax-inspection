import type { Context } from 'hono';
import type {
  AccessTokenClaims,
  DeletePayment,
  GetPayment,
  GetPayments,
  PatchPayment,
  PostPayment,
} from '@tax-inspection/shared';
import { paymentsService } from './payments.service';

export const paymentsController = {
  async getAll(c: Context, query: GetPayments) {
    return c.json(await paymentsService.list(query));
  },

  async getById(c: Context, params: GetPayment) {
    const payment = await paymentsService.findById(params.id);
    if (!payment) {
      return c.json({ error: `Payment ${params.id} not found` }, 404);
    }
    return c.json(payment);
  },

  async create(c: Context, body: PostPayment) {
    // Set by requireAuth from the verified access token.
    const claims = c.get('user') as AccessTokenClaims | undefined;
    if (!claims?.sub) {
      return c.json({ error: 'Unauthenticated' }, 401);
    }
    const payment = await paymentsService.create(body, claims.sub);
    return c.json(payment, 201);
  },

  async update(c: Context, params: GetPayment, body: PatchPayment) {
    const payment = await paymentsService.update(params.id, body);
    if (!payment) {
      return c.json({ error: `Payment ${params.id} not found` }, 404);
    }
    return c.json(payment);
  },

  async remove(c: Context, params: DeletePayment) {
    const deleted = await paymentsService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `Payment ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
