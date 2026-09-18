import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { AccessTokenClaims } from '@tax-inspection/shared';
import { env } from '../config/env';
import { JWT_ALG } from '../utils/jwt';

/** Context variables set by {@link requireAuth}. */
export interface AuthVariables {
  user: AccessTokenClaims;
}

/**
 * Require a valid `Authorization: Bearer <jwt>` header. On success the decoded
 * claims are available via `c.get('user')`; otherwise responds 401.
 */
export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or malformed Authorization header' }, 401);
    }

    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = await verify(token, env.jwtAccessSecret, JWT_ALG);
      c.set('user', payload as unknown as AccessTokenClaims);
    } catch {
      return c.json({ error: 'Invalid or expired access token' }, 401);
    }

    await next();
  },
);
