import { z } from 'zod';
import {
  paginatedSchema,
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import {
  paymentSchema,
  paymentStatusSchema,
  type Payment,
} from './payment.model';

/**
 * POST /payments — create body. The server generates `id`, sets `created_by`
 * from the authenticated user, and the `createdAt` timestamp.
 */
export const postPaymentSchema = paymentSchema.omit({
  id: true,
  created_by: true,
  source_of_material: true,
  createdAt: true,
});
export type PostPayment = z.infer<typeof postPaymentSchema>;

/** PATCH /payments/:id — partial update. `id` comes from the route. */
export const patchPaymentSchema = paymentSchema
  .omit({
    id: true,
    created_by: true,
    source_of_material: true,
    createdAt: true,
  })
  .partial();
export type PatchPayment = z.infer<typeof patchPaymentSchema>;

/** GET /payments/:id — route params. */
export const getPaymentSchema = z.object({ id: z.uuid() });
export type GetPayment = z.infer<typeof getPaymentSchema>;

/** DELETE /payments/:id — route params. */
export const deletePaymentSchema = z.object({ id: z.uuid() });
export type DeletePayment = z.infer<typeof deletePaymentSchema>;

/** GET /payments — pagination query plus payment filters. */
export const getPaymentsSchema = paginationQuerySchema.extend({
  delivery_id: z.uuid().optional(),
  payment_status: paymentStatusSchema.optional(),
});
export type GetPayments = z.infer<typeof getPaymentsSchema>;

/** GET /payments response — a paginated list of payments. */
export const getPaymentsResponseSchema = paginatedSchema(paymentSchema);
export type GetPaymentsResponse = Paginated<Payment>;
