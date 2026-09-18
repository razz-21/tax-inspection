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

export const patchUserSchema = userSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
export type PatchUser = z.infer<typeof patchUserSchema>;

export const getUserSchema = z.object({ id: z.uuid() });
export type GetUser = z.infer<typeof getUserSchema>;

export const deleteUserSchema = z.object({ id: z.uuid() });
export type DeleteUser = z.infer<typeof deleteUserSchema>;

export const getUsersSchema = paginationQuerySchema.extend({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});
export type GetUsers = z.infer<typeof getUsersSchema>;

export const getUsersResponseSchema = paginatedSchema(publicUserSchema);
export type GetUsersResponse = Paginated<PublicUser>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type Login = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  user: publicUserSchema,
  /** Short-lived JWT (15m). Sent as `Authorization: Bearer <token>`. */
  accessToken: z.string(),
  /** Long-lived JWT (7d). Exchanged at /users/refresh for a new access token. */
  refreshToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** Decoded JWT access-token claims. `sub` is the user's id. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: PublicUser['role'];
  iat: number;
  exp: number;
}

/** Decoded JWT refresh-token claims. `sub` is the user's id. */
export interface RefreshTokenClaims {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

/** POST /users/refresh — exchange a refresh token for a fresh access token. */
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshSchema>;

/** POST /users/refresh response — a new access token. */
export const refreshResponseSchema = z.object({ accessToken: z.string() });
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/**
 * POST /users/change-password — change the signed-in user's password. The
 * user is taken from the access token; the new password must be 8+ chars with
 * at least one upper and one lower case letter.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
      'Include both upper and lower case letters.',
    ),
});
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type LoginErrorReason =
  | 'invalid_credentials'
  | 'inactive'
  | 'needs_approval';

export interface LoginErrorResponse {
  error: string;
  reason: LoginErrorReason;
}

export const LOGIN_STATUS_MESSAGES: Record<
  Exclude<LoginErrorReason, 'invalid_credentials'>,
  string
> = {
  inactive:
    'Your account is inactive. Please contact an administrator to regain access.',
  needs_approval:
    'Your account is pending approval. An administrator must approve it before you can sign in.',
};
