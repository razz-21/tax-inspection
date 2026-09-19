import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type Delivery,
  type DeliveryCreator,
  type GetDeliveries,
  type GetDeliveriesResponse,
  type Hauler,
  type Materials,
  type PatchDelivery,
  type PostDelivery,
  type Truck,
  type UserRole,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryDoc {
  _id: string;
  created_by: string;
  is_new?: boolean;
  haulers: Hauler;
  truck: Truck;
  materials: Materials;
  date: string;
  time: string;
  place_of_deliveries: string;
  quantity: number;
  receipt_number: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

/** Minimal user shape needed to resolve a delivery's creator. */
interface UserRef {
  _id: string;
  fullname: string;
  role: UserRole;
}

const collection = (): Collection<DeliveryDoc> =>
  getDb().collection<DeliveryDoc>('deliveries');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/**
 * Resolve `created_by` ids to `{ id, name, role }` snapshots in one query.
 * Returns a map keyed by user id.
 */
async function creatorMap(
  ids: string[],
): Promise<Map<string, DeliveryCreator>> {
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

/** Map a Mongo document to the domain `Delivery`. */
function toDomain(
  doc: DeliveryDoc,
  creator: DeliveryCreator | null = null,
): Delivery {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    created_by: doc.created_by,
    creator,
    is_new: doc.is_new ?? false,
    haulers: doc.haulers,
    truck: doc.truck,
    materials: doc.materials,
    date: doc.date,
    time: doc.time,
    place_of_deliveries: doc.place_of_deliveries,
    quantity: doc.quantity,
    receipt_number: doc.receipt_number,
    remarks: doc.remarks ?? '',
    createdAt: toIso(doc.created_at),
    updatedAt: toIso(doc.updated_at),
  };
}

export const deliveriesService = {
  async list(query: GetDeliveries): Promise<GetDeliveriesResponse> {
    const {
      limit,
      page,
      offset,
      search,
      sortBy,
      sortOrder,
      truck_type,
      material_type,
    } = query;

    const filter: Record<string, unknown> = {};
    if (truck_type) filter['truck.truck_type'] = truck_type;
    if (material_type) filter['materials.material_type'] = material_type;
    if (search) {
      // Deliveries are searchable by source of material only.
      filter['materials.source_of_material'] = { $regex: search, $options: 'i' };
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

    const creators = await creatorMap(docs.map((d) => d.created_by));

    return {
      data: docs.map((d) => toDomain(d, creators.get(d.created_by) ?? null)),
      meta: buildPaginationMeta(total, { page, limit, offset }),
    };
  },

  async findById(id: string): Promise<Delivery | null> {
    const doc = await collection().findOne({ _id: id });
    if (!doc) return null;
    const creators = await creatorMap([doc.created_by]);
    return toDomain(doc, creators.get(doc.created_by) ?? null);
  },

  async create(input: PostDelivery, createdBy: string): Promise<Delivery> {
    const timestamp = nowIso();
    const doc: DeliveryDoc = {
      _id: newId(),
      created_by: createdBy,
      // Field-officer reports start flagged as new.
      is_new: true,
      haulers: input.haulers,
      truck: input.truck,
      materials: input.materials,
      date: input.date,
      time: input.time,
      place_of_deliveries: input.place_of_deliveries,
      quantity: input.quantity,
      receipt_number: input.receipt_number,
      remarks: input.remarks ?? '',
      created_at: timestamp,
      updated_at: timestamp,
    };

    await collection().insertOne(doc);
    const creators = await creatorMap([createdBy]);
    return toDomain(doc, creators.get(createdBy) ?? null);
  },

  async update(id: string, patch: PatchDelivery): Promise<Delivery | null> {
    const $set: Partial<DeliveryDoc> = {
      ...(patch as Partial<DeliveryDoc>),
      updated_at: nowIso(),
    };

    const doc = await collection().findOneAndUpdate(
      { _id: id },
      { $set },
      { returnDocument: 'after' },
    );

    if (!doc) return null;
    const creators = await creatorMap([doc.created_by]);
    return toDomain(doc, creators.get(doc.created_by) ?? null);
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
