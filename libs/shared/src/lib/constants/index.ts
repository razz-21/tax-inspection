import type { InspectionStatus } from '../models';

/** Base path all API routes are mounted under. */
export const API_PREFIX = '/api';

/** Default port the API listens on. */
export const DEFAULT_API_PORT = 3000;

/** Human-readable labels for each inspection status. */
export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  flagged: 'Flagged',
};
