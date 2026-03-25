/**
 * Shared constants and types for the service layer.
 * IMPORTANT: NEVER select passwordHash when including User relations.
 */

/** Safe user select – reuse in every Prisma include that touches User */
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

/** Standard soft-delete filter – add to every `where` on soft-deletable models */
export const NOT_DELETED = { deletedAt: null } as const;

/** Pagination result wrapper */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Pagination input */
export interface PaginationInput {
  page?: number;
  limit?: number;
}

export function buildPagination(input?: PaginationInput) {
  const page = input?.page && input.page > 0 ? input.page : 0;
  const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 0;
  const isPaginated = page > 0 && limit > 0;
  return { page, limit, isPaginated, skip: isPaginated ? (page - 1) * limit : 0 };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
