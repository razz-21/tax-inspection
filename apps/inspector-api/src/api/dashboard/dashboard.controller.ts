import type { Context } from 'hono';
import type { GetDashboard } from '@tax-inspection/shared';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  async get(c: Context, query: GetDashboard) {
    return c.json(await dashboardService.summary(query.range));
  },
};
