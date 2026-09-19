import type { Collection } from 'mongodb';
import type {
  GetReport,
  GetReportResponse,
  ReportRow,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface DeliveryDoc {
  _id: string;
  haulers?: { name?: string; address?: string };
  truck?: { plate_number?: string };
  materials?: { source_of_material?: string; material_type?: string };
  date?: string;
  time?: string;
  place_of_deliveries?: string;
  quantity?: number;
  receipt_number?: string;
  remarks?: string;
}

const collection = (): Collection<DeliveryDoc> =>
  getDb().collection<DeliveryDoc>('deliveries');

const pad = (n: number): string => String(n).padStart(2, '0');

function toRow(doc: DeliveryDoc): ReportRow {
  return {
    id: doc._id,
    hauler_name: doc.haulers?.name ?? '',
    truck_plate: doc.truck?.plate_number ?? '',
    address: doc.haulers?.address ?? '',
    time: doc.time ?? '',
    source_of_material: doc.materials?.source_of_material ?? '',
    material_type: doc.materials?.material_type ?? '',
    quantity: doc.quantity ?? 0,
    place_of_delivery: doc.place_of_deliveries ?? '',
    receipt_number: doc.receipt_number ?? '',
    remarks: doc.remarks ?? '',
    date: doc.date ?? '',
  };
}

export const reportsService = {
  /** All deliveries dated within the given month/year, ordered by date + time. */
  async list(query: GetReport): Promise<GetReportResponse> {
    const { month, year } = query;
    const start = `${year}-${pad(month)}-01`;
    const end =
      month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;

    const docs = await collection()
      .find({ date: { $gte: start, $lt: end } })
      .sort({ date: 1, time: 1 })
      .toArray();

    return docs.map(toRow);
  },
};
