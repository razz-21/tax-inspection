import { z } from 'zod';

/**
 * Common pagination + sorting query. Uses `z.coerce` so raw string query
 * params (e.g. `?page=2&limit=10`) are coerced to numbers.
 *
 * Supports both page-based (`page`/`limit`) and offset-based (`offset`/`limit`)
 * pagination — `offset` takes precedence when provided.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Build a paginated-response schema for a given item schema. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Resolve the effective `offset`/`page` from a query and compute response meta.
 * `offset` wins over `page` when supplied.
 */
export function buildPaginationMeta(
  total: number,
  query: Pick<PaginationQuery, 'page' | 'limit' | 'offset'>,
): PaginationMeta {
  const { limit } = query;
  const offset = query.offset ?? (query.page - 1) * limit;
  const page = query.offset !== undefined ? Math.floor(offset / limit) + 1 : query.page;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    offset,
    total,
    totalPages,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
  };
}
