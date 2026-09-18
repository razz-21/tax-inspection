import { sign, verify } from 'hono/jwt';
import type {
  AccessTokenClaims,
  PublicUser,
  RefreshTokenClaims,
} from '@tax-inspection/shared';
import { env } from '../config/env';

/** HMAC-SHA256 — the default symmetric algorithm for our shared-secret tokens. */
export const JWT_ALG = 'HS256' as const;

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/** Issue a short-lived access token identifying the given user. */
export function signAccessToken(user: PublicUser): Promise<string> {
  const iat = nowSeconds();
  const claims: AccessTokenClaims = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat,
    exp: iat + env.accessTokenTtlSeconds,
  };
  return sign({ ...claims }, env.jwtAccessSecret, JWT_ALG);
}

/** Issue a long-lived refresh token for the given user. */
export function signRefreshToken(user: PublicUser): Promise<string> {
  const iat = nowSeconds();
  const claims: RefreshTokenClaims = {
    sub: user.id,
    type: 'refresh',
    iat,
    exp: iat + env.refreshTokenTtlSeconds,
  };
  return sign({ ...claims }, env.jwtRefreshSecret, JWT_ALG);
}

/** Verify a refresh token, resolving with its claims or throwing when invalid. */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenClaims> {
  const payload = await verify(token, env.jwtRefreshSecret, JWT_ALG);
  return payload as unknown as RefreshTokenClaims;
}
