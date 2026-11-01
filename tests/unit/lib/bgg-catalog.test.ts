import { afterEach, describe, expect, it, vi } from "vitest";
import { BggCatalogError, getBggCatalogDetail, searchBggCatalog } from "@/lib/bgg-catalog";

const xmlResponse = (body: string, status = 200) => new Response(body, {
  status,
  headers: { "Content-Type": "application/xml" },
});

describe("BGG catalog service", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns parsed catalog results from a valid BGG XML response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse(
      '<items total="1"><item type="boardgame" id="13"><name type="primary" value="Catan"/><yearpublished value="1995"/></item></items>',
    )));

    await expect(searchBggCatalog("Catan")).resolves.toEqual([
      { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
    ]);
  });

  it("treats a valid empty BGG response as an empty result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse('<items total="0"></items>')));
    await expect(searchBggCatalog("No match")).resolves.toEqual([]);
  });

  it("caps successful searches at twenty results", async () => {
    const entries = Array.from({ length: 21 }, (_, index) => `<item type="boardgame" id="${index + 1}"><name type="primary" value="Game ${index + 1}"/></item>`).join("");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse(`<items total="21">${entries}</items>`)));
    await expect(searchBggCatalog("Game")).resolves.toHaveLength(20);
  });

  it("does not turn HTML or malformed XML into an empty result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse("<html>upstream failure</html>")));
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse('<items><item id="13" type="boardgame"></items>')));
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 502 });
  });

  it("maps upstream failures and retries queued BGG requests within the deadline", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(xmlResponse("", 202))
      .mockResolvedValueOnce(xmlResponse('<items total="0"></items>'));
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchBggCatalog("Catan")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse("unavailable", 503)));
    await expect(searchBggCatalog("Catan")).rejects.toBeInstanceOf(BggCatalogError);
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 503 });

    const stillQueued = vi.fn().mockResolvedValue(xmlResponse("", 202));
    vi.stubGlobal("fetch", stillQueued);
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 503 });
    expect(stillQueued).toHaveBeenCalledTimes(3);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse("rate limited", 429)));
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 503 });
  });

  it("parses normalized detail data from the shared BGG XML rules", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(xmlResponse(
      '<?xml version="1.0"?><items total="1"><item id="13" type="boardgame"><name type="primary" value="Catan"/><yearpublished value="1995"/><minplayers value="3"/><maxplayers value="4"/><playingtime value="90"/><description>A &amp; B</description><image>https://cf.geekdo-images.com/catan.jpg</image><thumbnail>https://cf.geekdo-images.com/catan-small.jpg</thumbnail></item></items>',
    )));
    await expect(getBggCatalogDetail("13")).resolves.toMatchObject({
      bggId: "13", name: "Catan", yearPublished: 1995, minPlayers: 3, maxPlayers: 4,
      playTimeMinutes: 90, description: "A & B", imageUrl: "https://cf.geekdo-images.com/catan.jpg",
    });
  });

  it("rejects responses above 2 MB even without a content-length header", async () => {
    const payload = new Uint8Array(2 * 1024 * 1024 + 1);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new ReadableStream({
      start(controller) { controller.enqueue(payload); controller.close(); },
    }))));
    await expect(searchBggCatalog("Catan")).rejects.toMatchObject({ status: 502 });
  });

  it("maps an aborted ten-second transport deadline to 504", async () => {
    const deadline = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    vi.stubGlobal("fetch", vi.fn((_url: string, options: { signal: AbortSignal }) => new Promise((_, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    })));
    const pending = searchBggCatalog("Catan");
    deadline.abort(new DOMException("deadline", "TimeoutError"));
    await expect(pending).rejects.toMatchObject({ status: 504 });
  });
});
