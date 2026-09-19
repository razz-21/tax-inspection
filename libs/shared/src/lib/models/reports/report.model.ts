import { z } from 'zod';

/** GET /reports query — the month (1-12) and year to report on. */
export const getReportSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type GetReport = z.infer<typeof getReportSchema>;

/** A single row of the tax inspection report (derived from a delivery). */
export interface ReportRow {
  id: string;
  hauler_name: string;
  truck_plate: string;
  address: string;
  time: string;
  source_of_material: string;
  material_type: string;
  quantity: number;
  place_of_delivery: string;
  receipt_number: string;
  remarks: string;
  /** Delivery date (`yyyy-mm-dd`), used for ordering. */
  date: string;
}

/** GET /reports response — all deliveries for the selected month, ordered. */
export type GetReportResponse = ReportRow[];
