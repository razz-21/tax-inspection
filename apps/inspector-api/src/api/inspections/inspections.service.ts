import { nowIso, type Inspection } from '@tax-inspection/shared';

/**
 * Business/data logic for the inspections entity.
 * Swap the in-memory array for a real datasource later — the controller/routes
 * don't change.
 */
const inspections: Inspection[] = [
  { id: '1', taxpayerId: 'TP-1001', status: 'pending', amountDue: 1250.5, createdAt: nowIso(), updatedAt: nowIso() },
  { id: '2', taxpayerId: 'TP-1002', status: 'in-progress', amountDue: 8420, createdAt: nowIso(), updatedAt: nowIso() },
  { id: '3', taxpayerId: 'TP-1003', status: 'flagged', amountDue: 19999.99, createdAt: nowIso(), updatedAt: nowIso() },
  { id: '4', taxpayerId: 'TP-1004', status: 'completed', amountDue: 0, createdAt: nowIso(), updatedAt: nowIso() },
];

export const inspectionsService = {
  findAll(): Inspection[] {
    return inspections;
  },
  findById(id: string): Inspection | undefined {
    return inspections.find((inspection) => inspection.id === id);
  },
};
