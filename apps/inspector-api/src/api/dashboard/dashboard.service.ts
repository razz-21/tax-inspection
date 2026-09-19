import type { Collection } from 'mongodb';
import {
  nowIso,
  type DashboardInspectionActivity,
  type DashboardPerDay,
  type DashboardRange,
  type DashboardRecentDelivery,
  type DashboardSummary,
  type DeliveryStatus,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryDoc {
  _id: string;
  haulers?: { name?: string };
  truck?: { truck_type?: string; plate_number?: string };
  materials?: { material_type?: string };
  quantity?: number;
  receipt_number?: string;
  /** Delivery date, stored as `yyyy-mm-dd`. */
  date?: string;
  created_at: string;
}

interface InspectionDoc {
  _id: string;
  delivery_id: string;
  user_id: string;
  inspection_date: string;
  actual_volume: number;
  allowed_volume: number;
  created_at: string;
}

interface UserRef {
  _id: string;
  fullname: string;
}

type Granularity = 'day' | 'week' | 'month';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const deliveries = (): Collection<DeliveryDoc> =>
  getDb().collection<DeliveryDoc>('deliveries');
const inspections = (): Collection<InspectionDoc> =>
  getDb().collection<InspectionDoc>('delivery_inspections');

const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Resolve [start, end) and the chart bucket size for a range. */
function rangeBounds(
  range: DashboardRange,
  now: Date,
): { start: Date; end: Date; granularity: Granularity } {
  const end = now;
  switch (range) {
    case 'today':
      return { start: startOfDay(now), end, granularity: 'day' };
    case 'this_week': {
      const d = startOfDay(now);
      const mondayOffset = (d.getDay() + 6) % 7; // Mon = 0
      d.setDate(d.getDate() - mondayOffset);
      return { start: d, end, granularity: 'day' };
    }
    case 'two_weeks': {
      const d = startOfDay(now);
      d.setDate(d.getDate() - 13);
      return { start: d, end, granularity: 'day' };
    }
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end,
        granularity: 'day',
      };
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), q * 3, 1),
        end,
        granularity: 'week',
      };
    }
    case 'this_year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end,
        granularity: 'month',
      };
  }
}

interface Bucket {
  startMs: number;
  endMs: number;
  dateIso: string;
  label: string;
}

function buildBuckets(start: Date, end: Date, granularity: Granularity): Bucket[] {
  const buckets: Bucket[] = [];
  const cur = new Date(start);
  // Guard against runaway loops.
  let guard = 0;
  while (cur < end && guard++ < 400) {
    const next = new Date(cur);
    let label: string;
    if (granularity === 'day') {
      next.setDate(cur.getDate() + 1);
      label = WEEKDAYS[cur.getDay()];
    } else if (granularity === 'week') {
      next.setDate(cur.getDate() + 7);
      label = `${MONTHS[cur.getMonth()]} ${cur.getDate()}`;
    } else {
      next.setMonth(cur.getMonth() + 1, 1);
      label = MONTHS[cur.getMonth()];
    }
    buckets.push({
      startMs: cur.getTime(),
      endMs: next.getTime(),
      dateIso: cur.toISOString(),
      label,
    });
    cur.setTime(next.getTime());
  }
  return buckets;
}

const ms = (iso: string): number => Date.parse(iso);
const isPassed = (i: InspectionDoc): boolean => i.actual_volume <= i.allowed_volume;

export const dashboardService = {
  async summary(range: DashboardRange): Promise<DashboardSummary> {
    const now = new Date(nowIso());
    const { start, end, granularity } = rangeBounds(range, now);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const prevStartIso = new Date(
      start.getTime() - (end.getTime() - start.getTime()),
    ).toISOString();

    const inRange = { created_at: { $gte: startIso, $lt: endIso } };

    const [deliveryDocs, inspectionDocs, prevDeliveryCount] = await Promise.all([
      deliveries().find(inRange).toArray(),
      inspections().find(inRange).toArray(),
      deliveries().countDocuments({
        created_at: { $gte: prevStartIso, $lt: startIso },
      }),
    ]);

    // --- KPI cards ---
    const deliveryCount = deliveryDocs.length;
    const deltaPct =
      prevDeliveryCount > 0
        ? Math.round(
            ((deliveryCount - prevDeliveryCount) / prevDeliveryCount) * 100,
          )
        : null;

    const volume = deliveryDocs.reduce((sum, d) => sum + (d.quantity ?? 0), 0);

    const passedCount = inspectionDocs.filter(isPassed).length;
    const flaggedCount = inspectionDocs.length - passedCount;
    const passRate =
      inspectionDocs.length > 0
        ? Math.round((passedCount / inspectionDocs.length) * 100)
        : 0;

    // --- Deliveries per day (bucketed by the delivery `date` attribute) ---
    const buckets = buildBuckets(start, end, granularity);
    const perDay: DashboardPerDay[] = buckets.map((b) => ({
      date: b.dateIso,
      label: b.label,
      deliveries: 0,
    }));
    const bucketIndex = (t: number): number =>
      buckets.findIndex((b) => t >= b.startMs && t < b.endMs);

    for (const d of deliveryDocs) {
      if (!d.date) continue;
      // Parse `yyyy-mm-dd` as a local date so it lines up with the buckets.
      const t = new Date(`${d.date}T00:00:00`).getTime();
      const i = bucketIndex(t);
      if (i >= 0) perDay[i].deliveries++;
    }

    // --- Material mix ---
    const materialCounts = new Map<string, number>();
    for (const d of deliveryDocs) {
      const type = d.materials?.material_type ?? 'Unknown';
      materialCounts.set(type, (materialCounts.get(type) ?? 0) + 1);
    }
    const materialMix = [...materialCounts.entries()]
      .map(([type, count]) => ({
        type,
        count,
        pct: deliveryCount > 0 ? Math.round((count / deliveryCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // --- Top hauler (by delivery count) ---
    const haulerCounts = new Map<string, number>();
    for (const d of deliveryDocs) {
      const name = d.haulers?.name?.trim();
      if (name) haulerCounts.set(name, (haulerCounts.get(name) ?? 0) + 1);
    }
    const topHauler =
      [...haulerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // --- Recent deliveries (with inspection status) ---
    const recentDocs = [...deliveryDocs]
      .sort((a, b) => ms(b.created_at) - ms(a.created_at))
      .slice(0, 6);
    const recentIds = recentDocs.map((d) => d._id);
    const statusByDelivery = new Map<string, DeliveryStatus>();
    if (recentIds.length) {
      const relInspections = await inspections()
        .find({ delivery_id: { $in: recentIds } })
        .sort({ created_at: -1 })
        .toArray();
      for (const ins of relInspections) {
        // Keep the latest inspection's outcome (sorted desc, first wins).
        if (!statusByDelivery.has(ins.delivery_id)) {
          statusByDelivery.set(
            ins.delivery_id,
            isPassed(ins) ? 'passed' : 'flagged',
          );
        }
      }
    }
    const recentDeliveries: DashboardRecentDelivery[] = recentDocs.map((d) => ({
      id: d._id,
      receipt_number: d.receipt_number ?? '—',
      hauler: d.haulers?.name ?? '—',
      truck: [d.truck?.truck_type, d.truck?.plate_number]
        .filter(Boolean)
        .join(' · '),
      material: d.materials?.material_type ?? '—',
      quantity: d.quantity ?? 0,
      status: statusByDelivery.get(d._id) ?? 'pending',
    }));

    // --- Inspection activity (recent inspections) ---
    const activityDocs = [...inspectionDocs]
      .sort((a, b) => ms(b.created_at) - ms(a.created_at))
      .slice(0, 6);
    const inspectorIds = [...new Set(activityDocs.map((i) => i.user_id))];
    const users = inspectorIds.length
      ? await getDb()
          .collection<UserRef>('users')
          .find({ _id: { $in: inspectorIds } })
          .toArray()
      : [];
    const nameById = new Map(users.map((u) => [u._id, u.fullname]));
    const inspectionActivity: DashboardInspectionActivity[] = activityDocs.map(
      (i) => ({
        id: i._id,
        inspector: nameById.get(i.user_id) ?? 'Unknown',
        outcome: isPassed(i) ? 'passed' : 'flagged',
        actual_volume: i.actual_volume,
        allowed_volume: i.allowed_volume,
        date: i.inspection_date || i.created_at,
      }),
    );

    return {
      range,
      start: startIso,
      end: endIso,
      deliveries: { count: deliveryCount, deltaPct },
      volume,
      inspections: {
        passed: passedCount,
        total: inspectionDocs.length,
        passRate,
      },
      flagged: flaggedCount,
      perDay,
      materialMix,
      topHauler,
      recentDeliveries,
      inspectionActivity,
    };
  },
};
