import type { Context } from 'hono';
import type {
  DeleteUser,
  GetUser,
  GetUsers,
  PatchUser,
  PostUser,
} from '@tax-inspection/shared';
import { usersService } from './users.service';

export const usersController = {
  async getAll(c: Context, query: GetUsers) {
    return c.json(await usersService.list(query));
  },

  async getById(c: Context, params: GetUser) {
    const user = await usersService.findById(params.id);
    if (!user) {
      return c.json({ error: `User ${params.id} not found` }, 404);
    }
    return c.json(user);
  },

  async create(c: Context, body: PostUser) {
    if (await usersService.findById(body.id)) {
      return c.json({ error: 'A user with this id already exists' }, 409);
    }
    if (await usersService.findByEmail(body.email)) {
      return c.json({ error: 'A user with this email already exists' }, 409);
    }

    const user = await usersService.create(body);
    return c.json(user, 201);
  },

  async update(c: Context, params: GetUser, body: PatchUser) {
    const user = await usersService.update(params.id, body);
    if (!user) {
      return c.json({ error: `User ${params.id} not found` }, 404);
    }
    return c.json(user);
  },

  async remove(c: Context, params: DeleteUser) {
    const deleted = await usersService.remove(params.id);
    if (!deleted) {
      return c.json({ error: `User ${params.id} not found` }, 404);
    }
    return c.body(null, 204);
  },
};
