export type InspectionStatus = 'pending' | 'in-progress' | 'completed' | 'flagged';

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
