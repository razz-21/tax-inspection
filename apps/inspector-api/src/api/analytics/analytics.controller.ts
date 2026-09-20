import type { Context } from 'hono';
import type { GetAnalytics } from '@tax-inspection/shared';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async get(c: Context, query: GetAnalytics) {
    return c.json(await analyticsService.summary(query.range));
  },
};
