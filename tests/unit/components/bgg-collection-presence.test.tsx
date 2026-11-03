import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { fetchBggCollectionPresence, useBggCollectionPresence } from "@/components/bgg/use-bgg-collection-presence";

const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
describe("BGG-Bestandsprüfung im Browser", () => {
  it("sendet IDs gebündelt und erhält einen eigenen Treffer sowie explizite Abwesenheit", async () => {
    fetchMock.mockResolvedValue(Response.json({matches: {"13": {id: "g1", name: "Catan"}, "42": null}}));
    await expect(fetchBggCollectionPresence(["13", "42"])).resolves.toEqual({"13": {id: "g1", name: "Catan"}, "42": null});
    expect(fetchMock).toHaveBeenCalledWith("/api/games/bgg-presence", expect.objectContaining({method: "POST", body: JSON.stringify({bggIds: ["13", "42"]})}));
  });
  it("behandelt HTTP-Fehler und unvollständige Antworten als Fehler, niemals als Abwesenheit", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}, {status: 503}));
    await expect(fetchBggCollectionPresence(["13"])).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(Response.json({matches: {}}));
    await expect(fetchBggCollectionPresence(["13"])).rejects.toThrow("unvollständig");
  });
  it("zeigt loading bis zur vollständigen Prüfung und ermöglicht erneuten Versuch", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({error: "offline"}, {status: 500}));
    fetchMock.mockResolvedValueOnce(Response.json({matches: {"13": null}}));
    const {result} = renderHook(() => useBggCollectionPresence(["13"]));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("error"));
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.matches["13"]).toBeNull();
  });
  it("überspringt leere ID-Mengen ohne Request", async () => {
    const {result} = renderHook(() => useBggCollectionPresence([]));
    await waitFor(() => expect(result.current.status).toBe("ready")); expect(fetchMock).not.toHaveBeenCalled();
  });
});
