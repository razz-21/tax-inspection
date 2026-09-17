import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  deleteUserSchema,
  getUserSchema,
  getUsersSchema,
  patchUserSchema,
  postUserSchema,
} from '@tax-inspection/shared';
import { usersController } from './users.controller';

export const usersRoutes = new Hono()
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
