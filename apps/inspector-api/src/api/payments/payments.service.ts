import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type GetPayments,
  type GetPaymentsResponse,
  type Payment,
  type PatchPayment,
  type PaymentStatus,
  type PostPayment,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface PaymentDoc {
  _id: string;
  delivery_id: string;
  tax_assessment: string;
  amount: number;
  payment_date: string;
  payment_status: PaymentStatus;
  cashier_number: string;
  receipt_number: string;
  created_by: string;
  created_at: string;
}

const collection = (): Collection<PaymentDoc> =>
  getDb().collection<PaymentDoc>('payments');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/** Map a Mongo document to the domain `Payment`. */
function toDomain(doc: PaymentDoc): Payment {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    delivery_id: doc.delivery_id,
    tax_assessment: doc.tax_assessment,
    amount: doc.amount,
    payment_date: doc.payment_date,
    payment_status: doc.payment_status,
    cashier_number: doc.cashier_number,
    receipt_number: doc.receipt_number,
    created_by: doc.created_by,
    createdAt: toIso(doc.created_at),
  };
}

export const paymentsService = {
  async list(query: GetPayments): Promise<GetPaymentsResponse> {
    const { limit, page, offset, sortBy, sortOrder, delivery_id, payment_status } =
      query;

    const filter: Record<string, unknown> = {};
    if (delivery_id) filter['delivery_id'] = delivery_id;
    if (payment_status) filter['payment_status'] = payment_status;

    const skip = offset ?? (page - 1) * limit;
    const sortField = sortBy ?? 'created_at';
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortOrder === 'desc' ? -1 : 1,
    };

    const col = collection();
    const [docs, total] = await Promise.all([
      col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return {
      data: docs.map(toDomain),
      meta: buildPaginationMeta(total, { page, limit, offset }),
    };
  },

  async findById(id: string): Promise<Payment | null> {
    const doc = await collection().findOne({ _id: id });
    return doc ? toDomain(doc) : null;
  },

  async create(input: PostPayment, createdBy: string): Promise<Payment> {
    const doc: PaymentDoc = {
      _id: newId(),
      delivery_id: input.delivery_id,
      tax_assessment: input.tax_assessment,
      amount: input.amount,
      payment_date: input.payment_date,
      payment_status: input.payment_status,
      cashier_number: input.cashier_number,
      receipt_number: input.receipt_number,
      created_by: createdBy,
      created_at: nowIso(),
    };

    await collection().insertOne(doc);
    return toDomain(doc);
  },

  async update(id: string, patch: PatchPayment): Promise<Payment | null> {
    const $set: Partial<PaymentDoc> = { ...(patch as Partial<PaymentDoc>) };

    const doc = await collection().findOneAndUpdate(
      { _id: id },
      { $set },
      { returnDocument: 'after' },
    );

    return doc ? toDomain(doc) : null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
