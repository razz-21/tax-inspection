import type { Collection } from 'mongodb';
import {
  newId,
  type GetSourceOfMaterialsResponse,
  type PatchSourceOfMaterial,
  type PostSourceOfMaterial,
  type SourceOfMaterial,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface SourceOfMaterialDoc {
  _id: string;
  name: string;
  description?: string;
  created_by: string;
}

const collection = (): Collection<SourceOfMaterialDoc> =>
  getDb().collection<SourceOfMaterialDoc>('source_of_materials');

/** Map a Mongo document to the domain `SourceOfMaterial`. */
function toDomain(doc: SourceOfMaterialDoc): SourceOfMaterial {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    name: doc.name,
    description: doc.description ?? '',
    created_by: doc.created_by,
  };
}

export const sourceOfMaterialsService = {
  /** All material sources, ordered by name. */
  async list(): Promise<GetSourceOfMaterialsResponse> {
    const docs = await collection().find().sort({ name: 1 }).toArray();
    return docs.map(toDomain);
  },

  async create(
    input: PostSourceOfMaterial,
    createdBy: string,
  ): Promise<SourceOfMaterial> {
    const doc: SourceOfMaterialDoc = {
      _id: newId(),
      name: input.name,
      description: input.description ?? '',
      created_by: createdBy,
    };

    await collection().insertOne(doc);
    return toDomain(doc);
  },

  async update(
    id: string,
    patch: PatchSourceOfMaterial,
  ): Promise<SourceOfMaterial | null> {
    const $set: Partial<SourceOfMaterialDoc> = {};
    if (patch.name !== undefined) $set.name = patch.name;
    if (patch.description !== undefined) $set.description = patch.description;

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
