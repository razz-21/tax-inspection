import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type DeliveryInspection,
  type GetDeliveryInspections,
  type GetDeliveryInspectionsResponse,
  type PostDeliveryInspection,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryInspectionDoc {
  _id: string;
  delivery_id: string;
  user_id: string;
  inspection_date: string;
  actual_volume: number;
  allowed_volume: number;
  remarks: string;
  created_at: string;
}

const collection = (): Collection<DeliveryInspectionDoc> =>
  getDb().collection<DeliveryInspectionDoc>('delivery_inspections');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/** Map a Mongo document to the domain `DeliveryInspection`. */
function toDomain(doc: DeliveryInspectionDoc): DeliveryInspection {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    delivery_id: doc.delivery_id,
    user_id: doc.user_id,
    inspection_date: doc.inspection_date,
    actual_volume: doc.actual_volume,
    allowed_volume: doc.allowed_volume,
    remarks: doc.remarks ?? '',
    createdAt: toIso(doc.created_at),
  };
}

export const deliveryInspectionsService = {
  async list(
    query: GetDeliveryInspections,
  ): Promise<GetDeliveryInspectionsResponse> {
    const { limit, page, offset, search, sortBy, sortOrder, delivery_id } =
      query;

    const filter: Record<string, unknown> = {};
    if (delivery_id) filter['delivery_id'] = delivery_id;
    if (search) {
      filter['remarks'] = { $regex: search, $options: 'i' };
    }

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

  async findById(id: string): Promise<DeliveryInspection | null> {
    const doc = await collection().findOne({ _id: id });
    return doc ? toDomain(doc) : null;
  },

  async create(
    input: PostDeliveryInspection,
    userId: string,
  ): Promise<DeliveryInspection> {
    const doc: DeliveryInspectionDoc = {
      _id: newId(),
      delivery_id: input.delivery_id,
      user_id: userId,
      inspection_date: input.inspection_date,
      actual_volume: input.actual_volume,
      allowed_volume: input.allowed_volume,
      remarks: input.remarks ?? '',
      created_at: nowIso(),
    };

    await collection().insertOne(doc);
    return toDomain(doc);
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
