import { z } from 'zod';

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Hold'] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/**
 * A payment recorded against a delivery. `id` is a UUID (maps to Mongo `_id`).
 * `delivery_id`, `tax_assessment`, and `created_by` are foreign keys.
 */
export const paymentSchema = z.object({
  id: z.uuid(),
  /** FK to the delivery being paid for. */
  delivery_id: z.uuid(),
  /** FK to the tax assessment this payment settles. */
  tax_assessment: z.uuid(),
  amount: z.coerce.number().nonnegative(),
  payment_date: z.string().min(1),
  payment_status: paymentStatusSchema,
  cashier_number: z.string().min(1),
  receipt_number: z.string().min(1),
  /** FK to the user who recorded the payment (set server-side from token). */
  created_by: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type Payment = z.infer<typeof paymentSchema>;
