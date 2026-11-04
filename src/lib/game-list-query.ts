export const GAME_PAGE_SIZE = 24;

export const GAME_SORT_OPTIONS = [
  "name_asc",
  "name_desc",
  "complexity_asc",
  "complexity_desc",
  "players_asc",
  "players_desc",
  "newest",
] as const;

export type GameSortOption = (typeof GAME_SORT_OPTIONS)[number];

export interface GameListQuery {
  page: number;
  limit: number;
  search: string;
  tagId: string | null;
  players: number | null;
  minComplexity: number | null;
  sort: GameSortOption;
}

function first(params: URLSearchParams, key: string) {
  return params.getAll(key)[0] ?? "";
}

function boundedInteger(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function parseGameListQuery(params: URLSearchParams): GameListQuery {
  const sort = first(params, "sort");
  const requestedLimit = boundedInteger(first(params, "limit"), 1, Number.MAX_SAFE_INTEGER);
  const search = first(params, "q").trim().slice(0, 100);
  const tag = first(params, "tag").trim();
  return {
    page: boundedInteger(first(params, "page"), 1, 1_000_000) ?? 1,
    limit: requestedLimit ? Math.min(requestedLimit, 100) : GAME_PAGE_SIZE,
    search,
    tagId: tag && tag.length <= 100 ? tag : null,
    players: boundedInteger(first(params, "players"), 1, 99),
    minComplexity: boundedInteger(first(params, "complexity"), 1, 5),
    sort: GAME_SORT_OPTIONS.includes(sort as GameSortOption) ? (sort as GameSortOption) : "name_asc",
  };
}

export function gameListQueryToSearchParams(query: GameListQuery, page = query.page): URLSearchParams {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query.search) params.set("q", query.search);
  if (query.tagId) params.set("tag", query.tagId);
  if (query.players != null) params.set("players", String(query.players));
  if (query.minComplexity != null) params.set("complexity", String(query.minComplexity));
  if (query.sort !== "name_asc") params.set("sort", query.sort);
  return params;
}
