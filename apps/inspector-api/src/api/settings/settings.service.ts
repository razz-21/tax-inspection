import type { Collection } from 'mongodb';
import {
  DEFAULT_TAX_RATE,
  type PatchSettings,
  type Settings,
} from '@tax-inspection/shared';
import { getDb } from '../../config/database';

interface SettingsDoc {
  _id: string;
  tax_rate: number;
}

/** The settings collection holds a single document with this fixed id. */
const SETTINGS_ID = 'app-settings';

const collection = (): Collection<SettingsDoc> =>
  getDb().collection<SettingsDoc>('settings');

export const settingsService = {
  /** Return the settings, seeding the default tax rate on first access. */
  async get(): Promise<Settings> {
    const doc = await collection().findOneAndUpdate(
      { _id: SETTINGS_ID },
      { $setOnInsert: { tax_rate: DEFAULT_TAX_RATE } },
      { upsert: true, returnDocument: 'after' },
    );
    return { tax_rate: doc?.tax_rate ?? DEFAULT_TAX_RATE };
  },

  async update(patch: PatchSettings): Promise<Settings> {
    const doc = await collection().findOneAndUpdate(
      { _id: SETTINGS_ID },
      { $set: { tax_rate: patch.tax_rate } },
      { upsert: true, returnDocument: 'after' },
    );
    return { tax_rate: doc?.tax_rate ?? patch.tax_rate };
  },
};
