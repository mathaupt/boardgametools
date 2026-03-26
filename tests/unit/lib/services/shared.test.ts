import { describe, it, expect } from "vitest";
import {
  SAFE_USER_SELECT,
  NOT_DELETED,
  buildPagination,
  paginatedResponse,
} from "@/lib/services/shared";

describe("SAFE_USER_SELECT", () => {
  it("has correct fields", () => {
    expect(SAFE_USER_SELECT).toEqual({ id: true, name: true, email: true });
  });
});

describe("NOT_DELETED", () => {
  it("has deletedAt: null", () => {
    expect(NOT_DELETED).toEqual({ deletedAt: null });
  });
});

describe("buildPagination", () => {
  it("returns defaults when no input", () => {
    const result = buildPagination();
    expect(result).toEqual({ page: 0, limit: 0, isPaginated: false, skip: 0 });
  });

  it("returns defaults when input is { page: 0, limit: 0 }", () => {
    const result = buildPagination({ page: 0, limit: 0 });
    expect(result).toEqual({ page: 0, limit: 0, isPaginated: false, skip: 0 });
  });

  it("returns correct skip with valid page/limit", () => {
    const result = buildPagination({ page: 3, limit: 20 });
    expect(result).toEqual({ page: 3, limit: 20, isPaginated: true, skip: 40 });
  });

  it("caps limit at 100", () => {
    const result = buildPagination({ page: 1, limit: 200 });
    expect(result.limit).toBe(100);
    expect(result.isPaginated).toBe(true);
    expect(result.skip).toBe(0);
  });

  it("treats negative page as 0 (limit preserved but not paginated)", () => {
    // page < 0 → page=0, limit stays valid but isPaginated=false (page=0)
    expect(buildPagination({ page: -1, limit: 10 })).toEqual({
      page: 0, limit: 10, isPaginated: false, skip: 0,
    });
  });

  it("treats negative limit as 0", () => {
    expect(buildPagination({ page: 2, limit: -5 })).toEqual({
      page: 2, limit: 0, isPaginated: false, skip: 0,
    });
  });
});

describe("paginatedResponse", () => {
  it("calculates totalPages correctly", () => {
    const result = paginatedResponse(["a", "b"], 10, 1, 3);
    expect(result).toEqual({
      data: ["a", "b"],
      total: 10,
      page: 1,
      limit: 3,
      totalPages: 4,
    });
  });

  it("returns correct structure with 0 items", () => {
    const result = paginatedResponse([], 0, 1, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
