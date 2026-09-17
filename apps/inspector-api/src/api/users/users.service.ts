import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  nowIso,
  type GetUsers,
  type GetUsersResponse,
  type PatchUser,
  type PostUser,
  type PublicUser,
  type User,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';
import { hashPassword } from '../../utils/password';

interface UserDoc {
  _id: string;
  fullname: string;
  email: string;
  password: string;
  role: User['role'];
  status: User['status'];
  avatar?: string;
  created_at: string;
  updated_at: string;
}

const collection = (): Collection<UserDoc> =>
  getDb().collection<UserDoc>('users');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/** Map a Mongo document to the domain `User`. */
function toDomain(doc: UserDoc): User {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    fullname: doc.fullname,
    email: doc.email,
    password: doc.password,
    role: doc.role,
    status: doc.status,
    avatar: doc.avatar ?? '',
    createdAt: toIso(doc.created_at),
    updatedAt: toIso(doc.updated_at),
  };
}

function toPublic({ password: _password, ...rest }: User): PublicUser {
  return rest;
}

export const usersService = {
  async list(query: GetUsers): Promise<GetUsersResponse> {
    const { limit, page, offset, search, sortBy, sortOrder, role, status } =
      query;

    const filter: Record<string, unknown> = {};
    if (role) filter['role'] = role;
    if (status) filter['status'] = status;
    if (search) {
      filter['$or'] = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
      data: docs.map((doc) => toPublic(toDomain(doc))),
      meta: buildPaginationMeta(total, { page, limit, offset }),
    };
  },

  async findById(id: string): Promise<PublicUser | null> {
    const doc = await collection().findOne({ _id: id });
    return doc ? toPublic(toDomain(doc)) : null;
  },

  async findByEmail(email: string): Promise<UserDoc | null> {
    return collection().findOne({ email });
  },

  async create(input: PostUser): Promise<PublicUser> {
    const timestamp = nowIso();
    const doc: UserDoc = {
      _id: input.id,
      fullname: input.fullname,
      email: input.email,
      password: await hashPassword(input.password),
      role: input.role,
      status: input.status,
      avatar: input.avatar ?? '',
      created_at: timestamp,
      updated_at: timestamp,
    };

    await collection().insertOne(doc);
    return toPublic(toDomain(doc));
  },

  async update(id: string, patch: PatchUser): Promise<PublicUser | null> {
    const { avatar, password, ...rest } = patch;
    const $set: Partial<UserDoc> = { ...rest, updated_at: nowIso() };
    if (avatar !== undefined) $set.avatar = avatar;
    if (password !== undefined) $set.password = await hashPassword(password);

    const doc = await collection().findOneAndUpdate(
      { _id: id },
      { $set },
      { returnDocument: 'after' },
    );

    return doc ? toPublic(toDomain(doc)) : null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
