import type { Context } from 'hono';
import type { GetReport } from '@tax-inspection/shared';
import { reportsService } from './reports.service';

export const reportsController = {
  async get(c: Context, query: GetReport) {
    return c.json(await reportsService.list(query));
  },
};
