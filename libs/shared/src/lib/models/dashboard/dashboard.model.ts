import { z } from 'zod';

/** Selectable date ranges for the dashboard filter. */
export const DASHBOARD_RANGES = [
  'today',
  'this_week',
  'two_weeks',
  'this_month',
  'this_quarter',
  'this_year',
] as const;
export const dashboardRangeSchema = z.enum(DASHBOARD_RANGES);
export type DashboardRange = z.infer<typeof dashboardRangeSchema>;

/** Human labels for each range (shared by API + UI). */
export const DASHBOARD_RANGE_LABELS: Record<DashboardRange, string> = {
  today: 'Today',
  this_week: 'This week',
  two_weeks: '2 Weeks',
  this_month: 'This Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
};

/** GET /dashboard query. */
export const getDashboardSchema = z.object({
  range: dashboardRangeSchema.default('this_week'),
});
export type GetDashboard = z.infer<typeof getDashboardSchema>;

/** Outcome of a delivery's inspection (or none yet). */
export type DeliveryStatus = 'passed' | 'flagged' | 'pending';

export interface DashboardPerDay {
  /** ISO date (start of the bucket). */
  date: string;
  /** Short label for the axis, e.g. "Mon" or "Sep 14". */
  label: string;
  /** Deliveries whose `date` falls in this bucket. */
  deliveries: number;
}

export interface DashboardMaterialSlice {
  type: string;
  count: number;
  /** Whole-number percent of total deliveries. */
  pct: number;
}

export interface DashboardRecentDelivery {
  id: string;
  receipt_number: string;
  hauler: string;
  truck: string;
  material: string;
  quantity: number;
  status: DeliveryStatus;
}

export interface DashboardInspectionActivity {
  id: string;
  inspector: string;
  outcome: 'passed' | 'flagged';
  actual_volume: number;
  allowed_volume: number;
  date: string;
}

/** Everything the dashboard renders for a given range. */
export interface DashboardSummary {
  range: DashboardRange;
  /** Range bounds (ISO). */
  start: string;
  end: string;
  deliveries: {
    count: number;
    /** Percent change vs the previous equal-length period (null if no prior data). */
    deltaPct: number | null;
  };
  /** Total cubic meters hauled. */
  volume: number;
  inspections: {
    passed: number;
    total: number;
    /** Whole-number pass rate percent. */
    passRate: number;
  };
  flagged: number;
  perDay: DashboardPerDay[];
  materialMix: DashboardMaterialSlice[];
  topHauler: string | null;
  recentDeliveries: DashboardRecentDelivery[];
  inspectionActivity: DashboardInspectionActivity[];
}
