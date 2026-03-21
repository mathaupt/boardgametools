import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn, _keys, _opts) => fn),
}));

import { cachedQuery } from "@/lib/cache";
import { unstable_cache } from "next/cache";

describe("cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls unstable_cache with query function and key parts", async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1 }]);
    await cachedQuery(queryFn, ["games", "list"]);
    expect(unstable_cache).toHaveBeenCalledWith(queryFn, ["games", "list"], {
      revalidate: 60,
      tags: undefined,
    });
  });

  it("defaults revalidate to 60 seconds", async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    await cachedQuery(queryFn, ["key"]);
    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Array),
      expect.objectContaining({ revalidate: 60 })
    );
  });

  it("passes custom revalidate and tags", async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    await cachedQuery(queryFn, ["key"], { revalidate: 120, tags: ["games"] });
    expect(unstable_cache).toHaveBeenCalledWith(queryFn, ["key"], {
      revalidate: 120,
      tags: ["games"],
    });
  });

  it("returns the result from the query function", async () => {
    const data = [{ id: 1, name: "Catan" }];
    const queryFn = vi.fn().mockResolvedValue(data);
    const result = await cachedQuery(queryFn, ["key"]);
    expect(result).toEqual(data);
  });
});
