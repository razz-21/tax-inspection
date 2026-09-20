import { z } from 'zod';

/** Selectable date ranges for the analytics filter. */
export const ANALYTICS_RANGES = [
  'this_month',
  'this_quarter',
  'this_year',
  'all',
] as const;
export const analyticsRangeSchema = z.enum(ANALYTICS_RANGES);
export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

/** Human labels for each range (shared by API + UI). */
export const ANALYTICS_RANGE_LABELS: Record<AnalyticsRange, string> = {
  this_month: 'This Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  all: 'All Time',
};

/** GET /analytics query. */
export const getAnalyticsSchema = z.object({
  range: analyticsRangeSchema.default('this_year'),
});
export type GetAnalytics = z.infer<typeof getAnalyticsSchema>;

/* -------------------------------------------------------------------------- */
/* Collection Rate Status                                                      */
/* -------------------------------------------------------------------------- */

/** Payment status mix over the range and the resulting accounts receivable. */
export interface AnalyticsCollectionRate {
  paidCount: number;
  pendingCount: number;
  holdCount: number;
  paidAmount: number;
  pendingAmount: number;
  holdAmount: number;
  /** Sum of every payment amount in range (paid + pending + hold). */
  totalAmount: number;
  /** Money still owed — pending + hold. */
  outstandingAmount: number;
  /** paidAmount / totalAmount, as a whole-number percent (0 when nothing billed). */
  collectionRatePct: number;
}

/* -------------------------------------------------------------------------- */
/* Collection Efficiency Index (CEI)                                           */
/* -------------------------------------------------------------------------- */

export interface AnalyticsLagBucket {
  /** e.g. "0–7 days". */
  label: string;
  count: number;
}

/** How quickly assessed penalties turn into collected payments. */
export interface AnalyticsCollectionEfficiency {
  /** Paid payments that could be matched to an assessment. */
  settledCount: number;
  /** Mean days between `assessed_date` and `payment_date` (null when none). */
  avgLagDays: number | null;
  medianLagDays: number | null;
  fastestDays: number | null;
  slowestDays: number | null;
  /** Distribution of collection lag across fixed buckets. */
  distribution: AnalyticsLagBucket[];
}

/* -------------------------------------------------------------------------- */
/* Logistical Bottleneck Detection                                             */
/* -------------------------------------------------------------------------- */

export interface AnalyticsHourly {
  /** 0–23. */
  hour: number;
  /** Short axis label, e.g. "8a", "1p". */
  label: string;
  deliveries: number;
}

export interface AnalyticsDestination {
  place: string;
  deliveries: number;
  /** Whole-number percent of located deliveries. */
  pct: number;
}

export interface AnalyticsWeekday {
  /** "Mon" … "Sun". */
  label: string;
  deliveries: number;
}

/** Peak delivery windows and high-traffic drop-off zones. */
export interface AnalyticsBottlenecks {
  totalDeliveries: number;
  /** Delivery counts for every hour of the day (0–23). */
  hourly: AnalyticsHourly[];
  /** Busiest one-hour window, e.g. "8:00–9:00 AM" (null when no timed deliveries). */
  peakWindowLabel: string | null;
  topDestinations: AnalyticsDestination[];
  /** Delivery counts per weekday, Monday first. */
  byWeekday: AnalyticsWeekday[];
  /** Deliveries whose `time` was missing or unparseable. */
  untimedCount: number;
}

/* -------------------------------------------------------------------------- */
/* Tax Revenue Trend Forecasting                                               */
/* -------------------------------------------------------------------------- */

export interface AnalyticsTrendPoint {
  /** e.g. "Oct '25". */
  label: string;
  revenue: number;
  kind: 'actual' | 'forecast';
}

/** Historical collected revenue plus a naive linear forecast. */
export interface AnalyticsRevenueTrend {
  /** Trailing months (of the last 12) that had any collected revenue. */
  monthsWithData: number;
  /** Whether there is enough history for the forecast to be meaningful. */
  sufficientData: boolean;
  /** Trailing 12 actual months followed by 3 forecast months. */
  points: AnalyticsTrendPoint[];
  /** Projected revenue for the upcoming month (null when no history). */
  projectedNextMonth: number | null;
}

/* -------------------------------------------------------------------------- */

/** Everything the analytics page renders for a given range. */
export interface AnalyticsSummary {
  range: AnalyticsRange;
  /** Range bounds (ISO). */
  start: string;
  end: string;
  collectionRate: AnalyticsCollectionRate;
  collectionEfficiency: AnalyticsCollectionEfficiency;
  bottlenecks: AnalyticsBottlenecks;
  /** Revenue trend is always trailing-12-months, independent of `range`. */
  revenueTrend: AnalyticsRevenueTrend;
}
