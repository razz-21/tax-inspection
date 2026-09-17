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
};
