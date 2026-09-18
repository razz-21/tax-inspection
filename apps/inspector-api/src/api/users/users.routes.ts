import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  deleteUserSchema,
  getUserSchema,
  getUsersSchema,
  loginSchema,
  patchUserSchema,
  postUserSchema,
  refreshSchema,
} from '@tax-inspection/shared';
import { usersController } from './users.controller';
import { requireAuth } from '../../middleware/auth';

export const usersRoutes = new Hono()
  // Public: login and refresh mint tokens, so they must not require a bearer.
  .post('/login', zValidator('json', loginSchema), (c) =>
    usersController.login(c, c.req.valid('json')),
  )
  .post('/refresh', zValidator('json', refreshSchema), (c) =>
    usersController.refresh(c, c.req.valid('json')),
  )
  // Everything below requires a valid `Authorization: Bearer <jwt>`.
  .use('*', requireAuth)
  .get('/', zValidator('query', getUsersSchema), (c) =>
    usersController.getAll(c, c.req.valid('query')),
  )
  .post('/', zValidator('json', postUserSchema), (c) =>
    usersController.create(c, c.req.valid('json')),
  )
  .get('/:id', zValidator('param', getUserSchema), (c) =>
    usersController.getById(c, c.req.valid('param')),
  )
  .patch(
    '/:id',
    zValidator('param', getUserSchema),
    zValidator('json', patchUserSchema),
    (c) => usersController.update(c, c.req.valid('param'), c.req.valid('json')),
  )
  .delete('/:id', zValidator('param', deleteUserSchema), (c) =>
    usersController.remove(c, c.req.valid('param')),
  );
