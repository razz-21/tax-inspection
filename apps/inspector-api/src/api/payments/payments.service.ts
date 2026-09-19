import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type GetPayments,
  type GetPaymentsResponse,
  type Payment,
  type PatchPayment,
  type PaymentRange,
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

/** Minimal delivery shape needed to resolve the source of material. */
interface DeliveryRef {
  _id: string;
  materials?: { source_of_material?: string };
}

const collection = (): Collection<PaymentDoc> =>
  getDb().collection<PaymentDoc>('payments');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/**
 * Resolve `delivery_id` ids to their source of material in one query.
 * Returns a map keyed by delivery id.
 */
async function sourceOfMaterialMap(
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const deliveries = await getDb()
    .collection<DeliveryRef>('deliveries')
    .find({ _id: { $in: unique } })
    .toArray();

  return new Map(
    deliveries.map((d) => [d._id, d.materials?.source_of_material ?? '']),
  );
}

/** Map a Mongo document to the domain `Payment`. */
function toDomain(
  doc: PaymentDoc,
  sourceOfMaterial: string | null = null,
): Payment {
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
    source_of_material: sourceOfMaterial,
    createdAt: toIso(doc.created_at),
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Resolve a payment range to inclusive-start / exclusive-end `yyyy-mm-dd` bounds. */
function paymentDateBounds(range: PaymentRange): { start: string; end: string } {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3);
  let start: Date;
  let end: Date;
  switch (range) {
    case 'today':
      start = day;
      end = new Date(y, m, day.getDate() + 1);
      break;
    case 'yesterday':
      start = new Date(y, m, day.getDate() - 1);
      end = day;
      break;
    case 'this_week': {
      const mondayOffset = (day.getDay() + 6) % 7;
      start = new Date(y, m, day.getDate() - mondayOffset);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      break;
    }
    case 'last_week': {
      const mondayOffset = (day.getDay() + 6) % 7;
      end = new Date(y, m, day.getDate() - mondayOffset);
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7);
      break;
    }
    case 'two_weeks':
      start = new Date(y, m, day.getDate() - 13);
      end = new Date(y, m, day.getDate() + 1);
      break;
    case 'this_month':
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 1);
      break;
    case 'last_month':
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
      break;
    case 'this_quarter':
      start = new Date(y, q * 3, 1);
      end = new Date(y, q * 3 + 3, 1);
      break;
    case 'last_quarter':
      start = new Date(y, q * 3 - 3, 1);
      end = new Date(y, q * 3, 1);
      break;
    case 'this_year':
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      break;
  }
  return { start: ymd(start), end: ymd(end) };
}

export const paymentsService = {
  async list(query: GetPayments): Promise<GetPaymentsResponse> {
    const {
      limit,
      page,
      offset,
      sortBy,
      sortOrder,
      delivery_id,
      payment_status,
      range,
    } = query;

    const filter: Record<string, unknown> = {};
    if (delivery_id) filter['delivery_id'] = delivery_id;
    if (payment_status) filter['payment_status'] = payment_status;
    if (range) {
      const { start, end } = paymentDateBounds(range);
      filter['payment_date'] = { $gte: start, $lt: end };
    }

    const skip = offset ?? (page - 1) * limit;
    const sortField = sortBy ?? 'created_at';
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortOrder === 'desc' ? -1 : 1,
    };

    const col = collection();
    const [docs, total, amountAgg] = await Promise.all([
      col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
      col
        .aggregate<{ total: number }>([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .toArray(),
    ]);

    const sources = await sourceOfMaterialMap(docs.map((d) => d.delivery_id));

    return {
      data: docs.map((d) => toDomain(d, sources.get(d.delivery_id) ?? null)),
      meta: buildPaginationMeta(total, { page, limit, offset }),
      totalAmount: amountAgg[0]?.total ?? 0,
    };
  },

  async findById(id: string): Promise<Payment | null> {
    const doc = await collection().findOne({ _id: id });
    if (!doc) return null;
    const sources = await sourceOfMaterialMap([doc.delivery_id]);
    return toDomain(doc, sources.get(doc.delivery_id) ?? null);
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
    const sources = await sourceOfMaterialMap([doc.delivery_id]);
    return toDomain(doc, sources.get(doc.delivery_id) ?? null);
  },

  async update(id: string, patch: PatchPayment): Promise<Payment | null> {
    const $set: Partial<PaymentDoc> = { ...(patch as Partial<PaymentDoc>) };

    const doc = await collection().findOneAndUpdate(
      { _id: id },
      { $set },
      { returnDocument: 'after' },
    );

    if (!doc) return null;
    const sources = await sourceOfMaterialMap([doc.delivery_id]);
    return toDomain(doc, sources.get(doc.delivery_id) ?? null);
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
