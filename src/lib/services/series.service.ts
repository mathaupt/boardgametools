import prisma from "@/lib/db";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString, firstError } from "@/lib/validation";
import { NOT_DELETED, buildPagination, paginatedResponse } from "./shared";

// ── Types ────────────────────────────────────────────────────────

export interface CreateSeriesInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export type UpdateSeriesInput = Partial<CreateSeriesInput>

export interface AddEntryInput {
  gameId: string;
  sortOrder?: number;
}

export interface UpdateEntryInput {
  played?: boolean;
  playedAt?: string | null;
  rating?: number | null;
  difficulty?: string | null;
  playTimeMinutes?: number | null;
  successful?: boolean | null;
  playerCount?: number | null;
  score?: number | null;
}

// ── Service ──────────────────────────────────────────────────────

const seriesInclude = {
  entries: {
    include: { game: { select: { imageUrl: true } } },
    orderBy: { sortOrder: "asc" as const },
  },
};

export const SeriesService = {
  /** List all series for a user (optionally paginated, cached when unpaginated) */
  async list(userId: string, opts?: { page?: number; limit?: number }) {
    const where = { ownerId: userId, ...NOT_DELETED };
    const { page, limit, isPaginated, skip } = buildPagination(opts);

    const addCounts = <T extends { entries: { played: boolean }[] }>(series: T[]) =>
      series.map((s) => ({
        ...s,
        _count: {
          entries: s.entries.length,
          played: s.entries.filter((e) => e.played).length,
        },
      }));

    if (isPaginated) {
      const [series, total] = await Promise.all([
        prisma.gameSeries.findMany({
          where,
          orderBy: { name: "asc" },
          include: seriesInclude,
          skip,
          take: limit,
        }),
        prisma.gameSeries.count({ where }),
      ]);
      return paginatedResponse(addCounts(series), total, page, limit);
    }

    return cachedQuery(
      async () => {
        const series = await prisma.gameSeries.findMany({
          where,
          orderBy: { name: "asc" },
          include: seriesInclude,
        });
        return addCounts(series);
      },
      ["user-series", userId],
      { revalidate: 120, tags: [CacheTags.userSeries(userId)] }
    );
  },

  /** Get a single series with entries */
  async getById(userId: string, seriesId: string) {
    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
      include: {
        entries: {
          include: { game: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!series) throw new ApiError(404, "Series not found");
    return series;
  },

  /** Create a new series */
  async create(userId: string, input: CreateSeriesInput) {
    const validationError = firstError(
      validateString(input.name, "name", { min: 1, max: 200 }),
      validateString(input.description, "description", { required: false, max: 1000 }),
      validateString(input.imageUrl, "imageUrl", { required: false, max: 2000 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    if (!input.name?.trim()) throw new ApiError(400, "Name is required");

    const series = await prisma.gameSeries.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        ownerId: userId,
      },
    });

    invalidateTag(CacheTags.userSeries(userId));
    return series;
  },

  /** Update a series */
  async update(userId: string, seriesId: string, input: UpdateSeriesInput) {
    const existing = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Series not found");

    const validationError = firstError(
      input.name ? validateString(input.name, "name", { min: 1, max: 200 }) : null,
      validateString(input.description, "description", { required: false, max: 1000 }),
      validateString(input.imageUrl, "imageUrl", { required: false, max: 2000 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const updated = await prisma.gameSeries.update({
      where: { id: seriesId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() || null }),
      },
      include: seriesInclude,
    });

    invalidateTag(CacheTags.userSeries(userId));
    return updated;
  },

  /** Soft-delete a series */
  async delete(userId: string, seriesId: string) {
    const existing = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Series not found");

    await prisma.gameSeries.update({
      where: { id: seriesId },
      data: { deletedAt: new Date() },
    });

    invalidateTag(CacheTags.userSeries(userId));
    return { message: "Series deleted" };
  },

  /** Add a game entry to a series */
  async addEntry(userId: string, seriesId: string, input: AddEntryInput) {
    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!series) throw new ApiError(404, "Series not found");

    const game = await prisma.game.findFirst({
      where: { id: input.gameId, ownerId: userId, deletedAt: null },
    });
    if (!game) throw new ApiError(404, "Game not found");

    // Calculate sortOrder if not provided
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const maxEntry = await prisma.gameSeriesEntry.findFirst({
        where: { seriesId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (maxEntry?.sortOrder ?? -1) + 1;
    }

    const entry = await prisma.gameSeriesEntry.create({
      data: {
        seriesId,
        gameId: input.gameId,
        sortOrder,
      },
      include: { game: true },
    });

    invalidateTag(CacheTags.userSeries(userId));
    return entry;
  },

  /** Update a series entry */
  async updateEntry(userId: string, seriesId: string, entryId: string, input: UpdateEntryInput) {
    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!series) throw new ApiError(404, "Series not found");

    const entry = await prisma.gameSeriesEntry.findFirst({
      where: { id: entryId, seriesId },
    });
    if (!entry) throw new ApiError(404, "Entry not found");

    const updated = await prisma.gameSeriesEntry.update({
      where: { id: entryId },
      data: {
        ...(input.played !== undefined && { played: input.played }),
        ...(input.playedAt !== undefined && { playedAt: input.playedAt ? new Date(input.playedAt) : null }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
        ...(input.playTimeMinutes !== undefined && { playTimeMinutes: input.playTimeMinutes }),
        ...(input.successful !== undefined && { successful: input.successful }),
        ...(input.playerCount !== undefined && { playerCount: input.playerCount }),
        ...(input.score !== undefined && { score: input.score }),
      },
      include: { game: true },
    });

    invalidateTag(CacheTags.userSeries(userId));
    return updated;
  },

  /** Delete a series entry */
  async deleteEntry(userId: string, seriesId: string, entryId: string) {
    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!series) throw new ApiError(404, "Series not found");

    const entry = await prisma.gameSeriesEntry.findFirst({
      where: { id: entryId, seriesId },
    });
    if (!entry) throw new ApiError(404, "Entry not found");

    await prisma.gameSeriesEntry.delete({ where: { id: entryId } });
    invalidateTag(CacheTags.userSeries(userId));
    return { message: "Entry deleted" };
  },

  /** Reorder entries in a series */
  async reorderEntries(userId: string, seriesId: string, entryIds: string[]) {
    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, ...NOT_DELETED },
    });
    if (!series) throw new ApiError(404, "Series not found");

    // Validate that all provided entry IDs belong to this series
    const validCount = await prisma.gameSeriesEntry.count({
      where: { id: { in: entryIds }, seriesId },
    });
    if (validCount !== entryIds.length) {
      throw new ApiError(400, "Invalid entry IDs - entries must belong to this series");
    }

    await prisma.$transaction(
      entryIds.map((id, index) =>
        prisma.gameSeriesEntry.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    invalidateTag(CacheTags.userSeries(userId));
    return { message: "Entries reordered" };
  },
};
