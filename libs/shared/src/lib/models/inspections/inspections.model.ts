import { z } from 'zod';

export const INSPECTION_STATUSES = [
  'pending',
  'in-progress',
  'completed',
  'flagged',
] as const;

export const inspectionStatusSchema = z.enum(INSPECTION_STATUSES);
export type InspectionStatus = z.infer<typeof inspectionStatusSchema>;

export interface Inspection {
  id: string;
  taxpayerId: string;
  status: InspectionStatus;
  amountDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Taxpayer {
  id: string;
  name: string;
  taxNumber: string;
  email?: string;
}
