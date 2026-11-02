import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { BGG_AUTH_TOKEN: "" } }));

import { fetchBggXml, BggTransportError } from "@/lib/bgg-fetch";
import { env } from "@/lib/env";

describe("fetchBggXml", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(env, "BGG_AUTH_TOKEN", { configurable: true, value: "" });
  });

  it("fetches an XML path without exposing a token when no token is configured", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<items></items>")));

    await expect(fetchBggXml("search?query=Catan")).resolves.toBe("<items></items>");
    expect(fetch).toHaveBeenCalledWith(
      "https://boardgamegeek.com/xmlapi2/search?query=Catan",
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
        cache: "no-store",
      }),
    );
  });

  it("returns an empty string when a successful response has no body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    await expect(fetchBggXml("thing?id=13")).resolves.toBe("");
  });

  it("rejects a response larger than the declared byte limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {
      status: 200,
      headers: { "content-length": String(2 * 1024 * 1024 + 1) },
    })));

    await expect(fetchBggXml("thing?id=13")).rejects.toMatchObject({ status: 502 });
  });

  it("maps a missing BGG item and other unsuccessful responses", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response("", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBggXml("thing?id=404")).rejects.toBeInstanceOf(BggTransportError);
    await expect(fetchBggXml("thing?id=13")).rejects.toMatchObject({ status: 502 });
  });

  it("maps an unexpected network failure to a temporary provider error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("socket unavailable")));

    await expect(fetchBggXml("thing?id=13")).rejects.toMatchObject({
      status: 503,
      message: "BoardGameGeek ist vorübergehend nicht erreichbar.",
    });
  });

  it("retries BGG's processing response and returns the completed XML", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 202 }))
      .mockResolvedValueOnce(new Response("<items/>"));
    vi.stubGlobal("fetch", fetchMock);

    const result = fetchBggXml("thing?id=13");
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toBe("<items/>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("stops after BGG keeps the request in processing state", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 202 })));

    const result = fetchBggXml("thing?id=13");
    const rejection = expect(result).rejects.toMatchObject({ status: 503 });
    await vi.advanceTimersByTimeAsync(750);

    await rejection;
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("limits a streamed body even when its content length is not declared", async () => {
    const oversizedChunk = new Uint8Array(2 * 1024 * 1024 + 1);
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(oversizedChunk);
      },
      cancel,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    await expect(fetchBggXml("thing?id=13")).rejects.toMatchObject({ status: 502 });
    expect(cancel).toHaveBeenCalled();
  });

  it("includes the configured token and composes a caller abort signal", async () => {
    const controller = new AbortController();
    Object.defineProperty(env, "BGG_AUTH_TOKEN", { configurable: true, value: "registered-app-token" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<items/>")));

    await expect(fetchBggXml("thing?id=13", controller.signal)).resolves.toBe("<items/>");

    const [, options = {}] = vi.mocked(fetch).mock.calls[0];
    expect(options.headers).toMatchObject({ Authorization: "Bearer registered-app-token" });
    expect(options.signal).not.toBe(controller.signal);
  });

  it("passes through caller cancellation instead of converting it to a provider outage", async () => {
    const controller = new AbortController();
    const abortReason = new Error("caller cancelled");
    controller.abort(abortReason);
    vi.stubGlobal("fetch", vi.fn((_url: string, options: { signal: AbortSignal }) => Promise.reject(options.signal.reason)));

    await expect(fetchBggXml("thing?id=13", controller.signal)).rejects.toBe(abortReason);
  });

  it("preserves caller cancellation while waiting for a queued BGG response", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const abortReason = new Error("caller cancelled while queued");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 202 })));

    const result = fetchBggXml("thing?id=13", controller.signal);
    const rejection = expect(result).rejects.toBe(abortReason);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    controller.abort(abortReason);

    await rejection;
    vi.useRealTimers();
  });
});
