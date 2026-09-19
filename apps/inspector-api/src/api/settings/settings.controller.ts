import type { Context } from 'hono';
import type { PatchSettings } from '@tax-inspection/shared';
import { settingsService } from './settings.service';

export const settingsController = {
  async get(c: Context) {
    return c.json(await settingsService.get());
  },

  async update(c: Context, body: PatchSettings) {
    return c.json(await settingsService.update(body));
  },
};
