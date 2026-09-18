import { API_PREFIX } from '@tax-inspection/shared';

/** Sharable, app-wide constant values. */
export const API_ENDPOINTS = {
  health: `${API_PREFIX}/health`,
  hello: `${API_PREFIX}/hello`,
  inspections: `${API_PREFIX}/inspections`,
  users: `${API_PREFIX}/users`,
  login: `${API_PREFIX}/users/login`,
  refresh: `${API_PREFIX}/users/refresh`,
} as const;
