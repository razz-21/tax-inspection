import { config as loadDotenv } from 'dotenv';
import { DEFAULT_API_PORT } from '@tax-inspection/shared';
import { getPort } from '../utils/env';

// Load .env for direct `node` runs. During `nx serve`, Nx already injects the
// project's .env into process.env, so this is just a harmless fallback.
loadDotenv();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Centralized, validated environment configuration. */
export const env = {
  port: getPort(DEFAULT_API_PORT),
  mongoUri: required('MONGODB_URI'),
  mongoDbName: process.env.MONGODB_DB_NAME ?? 'tax-inspection-dev',
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ?? 'dev-insecure-access-secret-change-me',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? 'dev-insecure-refresh-secret-change-me',
  /** Access-token lifetime in seconds (default 15 minutes). */
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL ?? 15 * 60),
  /** Refresh-token lifetime in seconds (default 7 days). */
  refreshTokenTtlSeconds: Number(
    process.env.REFRESH_TOKEN_TTL ?? 7 * 24 * 60 * 60,
  ),
};
