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

/** Selectable date ranges for filtering payments (by `payment_date`). */
export const PAYMENT_RANGES = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'two_weeks',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
] as const;
export const paymentRangeSchema = z.enum(PAYMENT_RANGES);
export type PaymentRange = z.infer<typeof paymentRangeSchema>;

/** Human labels for each range (shared by API + UI). */
export const PAYMENT_RANGE_LABELS: Record<PaymentRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_week: 'Last Week',
  two_weeks: '2 Weeks',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
};

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
  range: paymentRangeSchema.optional(),
});
export type GetPayments = z.infer<typeof getPaymentsSchema>;

/** GET /payments response — a paginated list plus the total amount for the filter. */
export const getPaymentsResponseSchema = paginatedSchema(paymentSchema).extend({
  totalAmount: z.number(),
});
export type GetPaymentsResponse = Paginated<Payment> & { totalAmount: number };
