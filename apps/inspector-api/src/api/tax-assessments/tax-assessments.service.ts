import type { Collection } from 'mongodb';
import {
  buildPaginationMeta,
  newId,
  nowIso,
  type GetTaxAssessments,
  type GetTaxAssessmentsResponse,
  type TaxAssessment,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';
import { settingsService } from '../settings/settings.service';

interface TaxAssessmentDoc {
  _id: string;
  delivery_id: string;
  excess_volume: number;
  penalty_rate: number;
  computed_tax: number;
  assessed_date: string;
  assessed_by: string;
  created_at: string;
}

/** Minimal inspection shape needed to compute excess volume. */
interface InspectionRef {
  actual_volume: number;
  allowed_volume: number;
}

const collection = (): Collection<TaxAssessmentDoc> =>
  getDb().collection<TaxAssessmentDoc>('tax_assessments');

const toIso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? nowIso());

/** Map a Mongo document to the domain `TaxAssessment`. */
function toDomain(doc: TaxAssessmentDoc): TaxAssessment {
  return {
    id: typeof doc._id === 'string' ? doc._id : String(doc._id),
    delivery_id: doc.delivery_id,
    excess_volume: doc.excess_volume,
    penalty_rate: doc.penalty_rate,
    computed_tax: doc.computed_tax,
    assessed_date: doc.assessed_date,
    assessed_by: doc.assessed_by,
    createdAt: toIso(doc.created_at),
  };
}

export const taxAssessmentsService = {
  async list(
    query: GetTaxAssessments,
  ): Promise<GetTaxAssessmentsResponse> {
    const { limit, page, offset, sortBy, sortOrder, delivery_id } = query;

    const filter: Record<string, unknown> = {};
    if (delivery_id) filter['delivery_id'] = delivery_id;

    const skip = offset ?? (page - 1) * limit;
    const sortField = sortBy ?? 'created_at';
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortOrder === 'desc' ? -1 : 1,
    };

    const col = collection();
    const [docs, total] = await Promise.all([
      col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return {
      data: docs.map(toDomain),
      meta: buildPaginationMeta(total, { page, limit, offset }),
    };
  },

  /**
   * Compute and persist a tax assessment for a delivery. Sums the excess
   * volume (actual over allowed) across every inspection, then charges the
   * penalty rate per unit of excess.
   */
  async calculate(
    deliveryId: string,
    assessedBy: string,
  ): Promise<TaxAssessment> {
    const inspections = await getDb()
      .collection<InspectionRef>('delivery_inspections')
      .find({ delivery_id: deliveryId })
      .toArray();

    const excessVolume = inspections.reduce(
      (sum, i) => sum + Math.max(0, (i.actual_volume ?? 0) - (i.allowed_volume ?? 0)),
      0,
    );

    // Penalty rate is the configurable tax rate from app settings.
    const { tax_rate: penaltyRate } = await settingsService.get();
    const timestamp = nowIso();
    const doc: TaxAssessmentDoc = {
      _id: newId(),
      delivery_id: deliveryId,
      excess_volume: excessVolume,
      penalty_rate: penaltyRate,
      computed_tax: excessVolume * penaltyRate,
      assessed_date: timestamp.slice(0, 10),
      assessed_by: assessedBy,
      created_at: timestamp,
    };

    // A delivery keeps a single, latest assessment — replace any prior ones.
    const col = collection();
    await col.deleteMany({ delivery_id: deliveryId });
    await col.insertOne(doc);
    return toDomain(doc);
  },

  async remove(id: string): Promise<boolean> {
    const result = await collection().deleteOne({ _id: id });
    return result.deletedCount === 1;
  },
};
