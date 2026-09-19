import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type DeliveryInspection,
  type GetDeliveryInspections,
  type GetDeliveryInspectionsResponse,
  type Inspector,
  type PostDeliveryInspection,
  type UserRole,
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

/** Minimal user shape needed to resolve an inspector. */
interface UserRef {
  _id: string;
  fullname: string;
  role: UserRole;
}

const collection = (): Collection<DeliveryInspectionDoc> =>
  getDb().collection<DeliveryInspectionDoc>('delivery_inspections');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/**
 * Resolve `user_id` ids to `{ id, name, role }` snapshots in one query.
 * Returns a map keyed by user id.
 */
async function inspectorMap(ids: string[]): Promise<Map<string, Inspector>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const users = await getDb()
    .collection<UserRef>('users')
    .find({ _id: { $in: unique } })
    .toArray();

  return new Map(
    users.map((u) => [u._id, { id: u._id, name: u.fullname, role: u.role }]),
  );
}

/** Map a Mongo document to the domain `DeliveryInspection`. */
function toDomain(
  doc: DeliveryInspectionDoc,
  inspector: Inspector | null = null,
): DeliveryInspection {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    delivery_id: doc.delivery_id,
    user_id: doc.user_id,
    inspector,
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

    const inspectors = await inspectorMap(docs.map((d) => d.user_id));

    return {
      data: docs.map((d) => toDomain(d, inspectors.get(d.user_id) ?? null)),
      meta: buildPaginationMeta(total, { page, limit, offset }),
    };
  },

  async findById(id: string): Promise<DeliveryInspection | null> {
    const doc = await collection().findOne({ _id: id });
    if (!doc) return null;
    const inspectors = await inspectorMap([doc.user_id]);
    return toDomain(doc, inspectors.get(doc.user_id) ?? null);
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
    const inspectors = await inspectorMap([userId]);
    return toDomain(doc, inspectors.get(userId) ?? null);
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
