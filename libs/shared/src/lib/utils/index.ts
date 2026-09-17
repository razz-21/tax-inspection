/** Format a numeric amount as a currency string. */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/** Type guard for non-null / non-undefined values. */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** Return the current time as an ISO 8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Generate a new UUID (v4). Use on the client to fill in an entity `id`. */
export function newId(): string {
  return crypto.randomUUID();
}
