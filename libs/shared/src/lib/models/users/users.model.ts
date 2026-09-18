import { z } from 'zod';

export const USER_ROLES = ['super_admin', 'admin', 'field_officer'] as const;
export const USER_STATUSES = ['active', 'inactive', 'needs_approval'] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

/** Full user record. `id` is a UUID (maps to Mongo `_id`). */
export const userSchema = z.object({
  id: z.uuid(),
  fullname: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
  role: userRoleSchema,
  status: userStatusSchema,
  avatar: z.string().default(''),
  contact_number: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** User without sensitive fields — safe to expose to the frontend. */
export const publicUserSchema = userSchema.omit({ password: true });

export type User = z.infer<typeof userSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
