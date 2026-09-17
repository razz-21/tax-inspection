import { z } from 'zod';
import {
  paginatedSchema,
  paginationQuerySchema,
  type Paginated,
} from '../common/pagination.model';
import {
  publicUserSchema,
  userRoleSchema,
  userSchema,
  userStatusSchema,
  type PublicUser,
} from './users.model';

/**
 * POST /users — create body. The client supplies the `id` (a UUID; generate it
 * with `newId()`); the server sets `createdAt`/`updatedAt`.
 */
export const postUserSchema = userSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type PostUser = z.infer<typeof postUserSchema>;

/** PATCH /users/:id — partial update. `id` comes from the route, not the body. */
export const patchUserSchema = userSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
export type PatchUser = z.infer<typeof patchUserSchema>;

/** GET /users/:id — route params. */
export const getUserSchema = z.object({ id: z.uuid() });
export type GetUser = z.infer<typeof getUserSchema>;

/** DELETE /users/:id — route params. */
export const deleteUserSchema = z.object({ id: z.uuid() });
export type DeleteUser = z.infer<typeof deleteUserSchema>;

/** GET /users — pagination query (page/limit/offset) plus user filters. */
export const getUsersSchema = paginationQuerySchema.extend({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});
export type GetUsers = z.infer<typeof getUsersSchema>;

/** GET /users response — a paginated list of public users. */
export const getUsersResponseSchema = paginatedSchema(publicUserSchema);
export type GetUsersResponse = Paginated<PublicUser>;
