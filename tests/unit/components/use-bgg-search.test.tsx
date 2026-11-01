import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBggSearch } from "@/components/public-event/use-bgg-search";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useBggSearch", () => {
  beforeEach(() => mockFetch.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("ignores a slower response after a newer query has completed", async () => {
    let resolveOld!: (response: Response) => void;
    mockFetch
      .mockReturnValueOnce(new Promise<Response>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "8217", name: "Azul", yearPublished: 2017, imageUrl: null },
      ]), { status: 200 }));
    const { result } = renderHook(() => useBggSearch("token"));

    let first!: Promise<void>;
    await act(async () => { first = result.current.search("Catan"); });
    await act(async () => { await result.current.search("Azul"); });
    await act(async () => {
      resolveOld(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }));
      await first;
    });
    expect(result.current.state).toMatchObject({ kind: "results", query: "Azul" });
  });

  it("does not start a duplicate request for the same in-flight query", async () => {
    let resolve!: (response: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise<Response>((done) => { resolve = done; }));
    const { result } = renderHook(() => useBggSearch("token"));
    let first!: Promise<void>;
    let duplicate!: Promise<void>;
    await act(async () => {
      first = result.current.search("Catan");
      duplicate = result.current.search("Catan");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      resolve(new Response("[]", { status: 200 }));
      await Promise.all([first, duplicate]);
    });
  });

  it("does not expose aborts as a search failure", async () => {
    mockFetch.mockImplementationOnce((_url: string, { signal }: { signal: AbortSignal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }));
    const { result } = renderHook(() => useBggSearch("token"));
    let pending!: Promise<void>;
    await act(async () => { pending = result.current.search("Catan"); });
    await act(async () => { result.current.reset(); await pending; });
    expect(result.current.state.kind).toBe("idle");
  });

  it("shows an explicit error for an unsuccessful request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: "BoardGameGeek ist nicht erreichbar." }), { status: 503 }));
    const { result } = renderHook(() => useBggSearch("token"));
    await act(async () => { await result.current.search("Catan"); });
    expect(result.current.state).toMatchObject({ kind: "error", query: "Catan", message: "BoardGameGeek ist nicht erreichbar." });
  });

  it("retries the last submitted query after a server error", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "vorübergehend" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }));
    const { result } = renderHook(() => useBggSearch("token"));
    await act(async () => { await result.current.search("Catan"); });
    await act(async () => { await result.current.retry(); });
    expect(result.current.state).toMatchObject({ kind: "results", query: "Catan" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("refreshes the event state when a search reports a closed event", async () => {
    const onStateConflict = vi.fn();
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Event geschlossen" }), { status: 409 }));
    const { result } = renderHook(() => useBggSearch("token", onStateConflict));
    await act(async () => { await result.current.search("Catan"); });
    expect(onStateConflict).toHaveBeenCalledOnce();
    expect(result.current.state.kind).toBe("error");
  });
});
