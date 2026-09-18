import type { Context } from 'hono';
import {
  LOGIN_STATUS_MESSAGES,
  type DeleteUser,
  type GetUser,
  type GetUsers,
  type Login,
  type LoginResponse,
  type PatchUser,
  type PostUser,
  type RefreshRequest,
  type RefreshResponse,
} from '@tax-inspection/shared';
import { usersService } from './users.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';

export const usersController = {
  async getAll(c: Context, query: GetUsers) {
    return c.json(await usersService.list(query));
  },

  async login(c: Context, body: Login) {
    const result = await usersService.authenticate(body);

    if (result.ok) {
      const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(result.user),
        signRefreshToken(result.user),
      ]);
      return c.json<LoginResponse>({
        user: result.user,
        accessToken,
        refreshToken,
      });
    }

    if (result.reason === 'invalid_credentials') {
      return c.json(
        { error: 'Invalid email or password', reason: result.reason },
        401,
      );
    }

    // Valid credentials but the account status forbids sign-in.
    return c.json(
      { error: LOGIN_STATUS_MESSAGES[result.reason], reason: result.reason },
      403,
    );
  },

  async refresh(c: Context, body: RefreshRequest) {
    let userId: string;
    try {
      ({ sub: userId } = await verifyRefreshToken(body.refreshToken));
    } catch {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }

    // Re-check the account on every refresh so a deactivated user can't keep
    // minting access tokens for the refresh token's remaining lifetime.
    const user = await usersService.findById(userId);
    if (!user || user.status !== 'active') {
      return c.json({ error: 'Account is no longer active' }, 401);
    }

    const accessToken = await signAccessToken(user);
    return c.json<RefreshResponse>({ accessToken });
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
