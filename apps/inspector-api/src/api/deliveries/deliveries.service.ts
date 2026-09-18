import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type Delivery,
  type GetDeliveries,
  type GetDeliveriesResponse,
  type Hauler,
  type Materials,
  type PatchDelivery,
  type PostDelivery,
  type Truck,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryDoc {
  _id: string;
  created_by: string;
  haulers: Hauler;
  truck: Truck;
  materials: Materials;
  address: string;
  date: string;
  time: string;
  place_of_deliveries: string;
  quantity: number;
  receipt_number: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

const collection = (): Collection<DeliveryDoc> =>
  getDb().collection<DeliveryDoc>('deliveries');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/** Map a Mongo document to the domain `Delivery`. */
function toDomain(doc: DeliveryDoc): Delivery {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    created_by: doc.created_by,
    haulers: doc.haulers,
    truck: doc.truck,
    materials: doc.materials,
    address: doc.address,
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
      filter['$or'] = [
        { receipt_number: { $regex: search, $options: 'i' } },
        { place_of_deliveries: { $regex: search, $options: 'i' } },
        { 'haulers.name': { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
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

  async findById(id: string): Promise<Delivery | null> {
    const doc = await collection().findOne({ _id: id });
    return doc ? toDomain(doc) : null;
  },

  async create(input: PostDelivery, createdBy: string): Promise<Delivery> {
    const timestamp = nowIso();
    const doc: DeliveryDoc = {
      _id: newId(),
      created_by: createdBy,
      haulers: input.haulers,
      truck: input.truck,
      materials: input.materials,
      address: input.address,
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
    return toDomain(doc);
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

    return doc ? toDomain(doc) : null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
