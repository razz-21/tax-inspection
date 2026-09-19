import { z } from 'zod';

/**
 * App-wide settings (a singleton). `tax_rate` is stored as a whole number
 * (e.g. `12`), applied to every new delivery assessment.
 */
export const settingsSchema = z.object({
  tax_rate: z.coerce.number().nonnegative(),
});
export type Settings = z.infer<typeof settingsSchema>;

/** PATCH /settings — update the tax rate. */
export const patchSettingsSchema = z.object({
  tax_rate: z.coerce.number().nonnegative(),
});
export type PatchSettings = z.infer<typeof patchSettingsSchema>;

/** Default tax rate used until an admin changes it. */
export const DEFAULT_TAX_RATE = 12;
