import type { Collection } from 'mongodb';
import {
  nowIso,
  type AnalyticsBottlenecks,
  type AnalyticsCollectionEfficiency,
  type AnalyticsCollectionRate,
  type AnalyticsRange,
  type AnalyticsRevenueTrend,
  type AnalyticsSummary,
  type AnalyticsTrendPoint,
  type PaymentStatus,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryDoc {
  _id: string;
  /** Delivery date, stored as `yyyy-mm-dd`. */
  date?: string;
  /** Free-text delivery time, e.g. "08:30" or "1:30 PM". */
  time?: string;
  place_of_deliveries?: string;
}

interface PaymentDoc {
  _id: string;
  delivery_id: string;
  tax_assessment: string;
  amount: number;
  payment_date: string;
  payment_status: PaymentStatus;
}

interface AssessmentDoc {
  _id: string;
  delivery_id: string;
  assessed_date: string;
  computed_tax: number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const deliveries = (): Collection<DeliveryDoc> =>
  getDb().collection<DeliveryDoc>('deliveries');
const payments = (): Collection<PaymentDoc> =>
  getDb().collection<PaymentDoc>('payments');
const assessments = (): Collection<AssessmentDoc> =>
  getDb().collection<AssessmentDoc>('tax_assessments');

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Resolve an analytics range to inclusive-start / exclusive-end `yyyy-mm-dd` bounds. */
function rangeBounds(
  range: AnalyticsRange,
  now: Date,
): { startDate: Date; endDate: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3);
  // End bound is the start of tomorrow so today's records are included.
  const endDate = new Date(y, m, now.getDate() + 1);
  let startDate: Date;
  switch (range) {
    case 'this_month':
      startDate = new Date(y, m, 1);
      break;
    case 'this_quarter':
      startDate = new Date(y, q * 3, 1);
      break;
    case 'this_year':
      startDate = new Date(y, 0, 1);
      break;
    case 'all':
      startDate = new Date(2000, 0, 1);
      break;
  }
  return { startDate, endDate };
}

/** Days between two `yyyy-mm-dd` dates (b − a), floored at 0. */
function dayDiff(a: string, b: string): number {
  const ta = new Date(`${a}T00:00:00`).getTime();
  const tb = new Date(`${b}T00:00:00`).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.max(0, Math.round((tb - ta) / 86_400_000));
}

const median = (nums: number[]): number | null => {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/** Extract the hour (0–23) from a free-text time, or null if unparseable. */
function parseHour(time: string | undefined): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([APap][Mm])?/);
  if (!match) return null;
  let hour = Number(match[1]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'am') {
    if (hour === 12) hour = 0;
  } else if (meridiem === 'pm') {
    if (hour !== 12) hour += 12;
  }
  return hour >= 0 && hour <= 23 ? hour : null;
}

/** Short axis label for an hour, e.g. 8 → "8a", 13 → "1p", 0 → "12a". */
function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'a' : 'p';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${suffix}`;
}

/** Long window label for the peak hour, e.g. 8 → "8:00–9:00 AM". */
function windowLabel(hour: number): string {
  const fmt = (h: number): string => {
    const suffix = h < 12 || h === 24 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${suffix}`;
  };
  return `${fmt(hour)}–${fmt(hour + 1)}`;
}

/** Project the next `steps` values with least-squares linear regression (≥ 0). */
function linearForecast(ys: number[], steps: number): number[] {
  const n = ys.length;
  if (n === 0) return Array(steps).fill(0);
  const xs = ys.map((_, i) => i);
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return Array.from({ length: steps }, (_, k) =>
    Math.max(0, Math.round(slope * (n + k) + intercept)),
  );
}

function collectionRate(docs: PaymentDoc[]): AnalyticsCollectionRate {
  const acc = {
    paidCount: 0, pendingCount: 0, holdCount: 0,
    paidAmount: 0, pendingAmount: 0, holdAmount: 0,
  };
  for (const p of docs) {
    const amount = p.amount ?? 0;
    if (p.payment_status === 'Paid') {
      acc.paidCount++;
      acc.paidAmount += amount;
    } else if (p.payment_status === 'Pending') {
      acc.pendingCount++;
      acc.pendingAmount += amount;
    } else if (p.payment_status === 'Hold') {
      acc.holdCount++;
      acc.holdAmount += amount;
    }
  }
  const totalAmount = acc.paidAmount + acc.pendingAmount + acc.holdAmount;
  return {
    ...acc,
    totalAmount,
    outstandingAmount: acc.pendingAmount + acc.holdAmount,
    collectionRatePct:
      totalAmount > 0 ? Math.round((acc.paidAmount / totalAmount) * 100) : 0,
  };
}

function collectionEfficiency(
  paidDocs: PaymentDoc[],
  assessedByDelivery: Map<string, string>,
): AnalyticsCollectionEfficiency {
  const lags: number[] = [];
  for (const p of paidDocs) {
    const assessedDate = assessedByDelivery.get(p.delivery_id);
    if (assessedDate && p.payment_date) {
      lags.push(dayDiff(assessedDate, p.payment_date));
    }
  }

  const buckets = [
    { label: '0–7 days', min: 0, max: 7 },
    { label: '8–14 days', min: 8, max: 14 },
    { label: '15–30 days', min: 15, max: 30 },
    { label: '31+ days', min: 31, max: Infinity },
  ];
  const distribution = buckets.map((b) => ({
    label: b.label,
    count: lags.filter((l) => l >= b.min && l <= b.max).length,
  }));

  return {
    settledCount: lags.length,
    avgLagDays: lags.length
      ? Math.round(lags.reduce((a, b) => a + b, 0) / lags.length)
      : null,
    medianLagDays: median(lags),
    fastestDays: lags.length ? Math.min(...lags) : null,
    slowestDays: lags.length ? Math.max(...lags) : null,
    distribution,
  };
}

function bottlenecks(docs: DeliveryDoc[]): AnalyticsBottlenecks {
  const hourCounts = new Array(24).fill(0);
  const weekdayCounts = new Array(7).fill(0);
  const placeCounts = new Map<string, number>();
  let untimedCount = 0;
  let locatedCount = 0;

  for (const d of docs) {
    const hour = parseHour(d.time);
    if (hour === null) untimedCount++;
    else hourCounts[hour]++;

    if (d.date) {
      const day = new Date(`${d.date}T00:00:00`).getDay(); // Sun = 0
      if (!Number.isNaN(day)) weekdayCounts[(day + 6) % 7]++; // Mon = 0
    }

    const place = d.place_of_deliveries?.trim();
    if (place) {
      placeCounts.set(place, (placeCounts.get(place) ?? 0) + 1);
      locatedCount++;
    }
  }

  const hourly = hourCounts.map((deliveries, hour) => ({
    hour,
    label: hourLabel(hour),
    deliveries,
  }));

  const peakHour = hourCounts.reduce(
    (best, count, hour) => (count > hourCounts[best] ? hour : best),
    0,
  );
  const peakWindowLabel = hourCounts[peakHour] > 0 ? windowLabel(peakHour) : null;

  const topDestinations = [...placeCounts.entries()]
    .map(([place, deliveries]) => ({
      place,
      deliveries,
      pct: locatedCount > 0 ? Math.round((deliveries / locatedCount) * 100) : 0,
    }))
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 8);

  const byWeekday = WEEKDAYS.map((label, i) => ({
    label,
    deliveries: weekdayCounts[i],
  }));

  return {
    totalDeliveries: docs.length,
    hourly,
    peakWindowLabel,
    topDestinations,
    byWeekday,
    untimedCount,
  };
}

async function revenueTrend(now: Date): Promise<AnalyticsRevenueTrend> {
  // Trailing 12 calendar months, ending with the current month.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      revenue: 0,
    };
  });
  const firstStart = ymd(new Date(months[0].year, months[0].month, 1));

  // Only collected (Paid) payments count as realised revenue.
  const paidDocs = await payments()
    .find({ payment_status: 'Paid', payment_date: { $gte: firstStart } })
    .toArray();

  const indexByKey = new Map(
    months.map((m, i) => [`${m.year}-${m.month}`, i]),
  );
  for (const p of paidDocs) {
    if (!p.payment_date) continue;
    const d = new Date(`${p.payment_date}T00:00:00`);
    const i = indexByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i !== undefined) months[i].revenue += p.amount ?? 0;
  }

  const actual: AnalyticsTrendPoint[] = months.map((m) => ({
    label: m.label,
    revenue: m.revenue,
    kind: 'actual',
  }));

  // Forecast the next 3 months from the trailing series.
  const projected = linearForecast(months.map((m) => m.revenue), 3);
  const forecast: AnalyticsTrendPoint[] = projected.map((revenue, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + k, 1);
    return {
      label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      revenue,
      kind: 'forecast',
    };
  });

  const monthsWithData = months.filter((m) => m.revenue > 0).length;
  return {
    monthsWithData,
    sufficientData: monthsWithData >= 6,
    points: [...actual, ...forecast],
    projectedNextMonth: monthsWithData > 0 ? projected[0] : null,
  };
}

export const analyticsService = {
  async summary(range: AnalyticsRange): Promise<AnalyticsSummary> {
    const now = new Date(nowIso());
    const { startDate, endDate } = rangeBounds(range, now);
    const startYmd = ymd(startDate);
    const endYmd = ymd(endDate);

    const [deliveryDocs, paymentDocs] = await Promise.all([
      deliveries()
        .find({ date: { $gte: startYmd, $lt: endYmd } })
        .toArray(),
      payments()
        .find({ payment_date: { $gte: startYmd, $lt: endYmd } })
        .toArray(),
    ]);

    // For CEI, resolve the assessment date behind each paid delivery.
    const paidDocs = paymentDocs.filter((p) => p.payment_status === 'Paid');
    const paidDeliveryIds = [...new Set(paidDocs.map((p) => p.delivery_id))];
    const assessedByDelivery = new Map<string, string>();
    if (paidDeliveryIds.length) {
      const assessmentDocs = await assessments()
        .find({ delivery_id: { $in: paidDeliveryIds } })
        .toArray();
      for (const a of assessmentDocs) {
        // Keep the earliest assessed_date per delivery (start of the collection clock).
        const existing = assessedByDelivery.get(a.delivery_id);
        if (!existing || a.assessed_date < existing) {
          assessedByDelivery.set(a.delivery_id, a.assessed_date);
        }
      }
    }

    return {
      range,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      collectionRate: collectionRate(paymentDocs),
      collectionEfficiency: collectionEfficiency(paidDocs, assessedByDelivery),
      bottlenecks: bottlenecks(deliveryDocs),
      revenueTrend: await revenueTrend(now),
    };
  },
};
