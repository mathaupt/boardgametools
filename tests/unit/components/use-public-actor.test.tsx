import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePublicActor } from "@/components/public-event/use-public-actor";

describe("usePublicActor", () => {
  beforeEach(() => window.localStorage.clear());

  it("does not expose or use a stored guest when a user session exists", async () => {
    window.localStorage.setItem("bgt-public-guest:event-token", JSON.stringify({
      id: "guest-1", nickname: "Alex", votes: ["proposal-1"],
    }));
    const { result } = renderHook(() => usePublicActor({
      token: "event-token",
      user: { id: "user-1", name: "Anna" },
      guests: [{ id: "guest-1", nickname: "Alex" }],
      proposalIds: ["proposal-1"],
    }));

    await waitFor(() => expect(result.current.actor.kind).toBe("user"));
    expect(result.current.guestVotes.size).toBe(0);
  });

  it("loads only a current-event guest and filters stale vote ids", async () => {
    window.localStorage.setItem("bgt-public-guest:event-token", JSON.stringify({
      id: "guest-1", nickname: "Old Name", votes: ["proposal-1", "foreign-proposal"],
    }));
    const { result } = renderHook(() => usePublicActor({
      token: "event-token",
      user: null,
      guests: [{ id: "guest-1", nickname: "Current Name" }],
      proposalIds: ["proposal-1"],
    }));

    await waitFor(() => expect(result.current.actor).toEqual({
      kind: "guest", guestId: "guest-1", nickname: "Current Name",
    }));
    expect([...result.current.guestVotes]).toEqual(["proposal-1"]);
  });

  it("persists a guest only after the caller confirms a successful join", async () => {
    const { result, rerender } = renderHook(({ guests }) => usePublicActor({
      token: "event-token", user: null, guests, proposalIds: [],
    }), { initialProps: { guests: [] as Array<{ id: string; nickname: string }> } });
    await waitFor(() => expect(result.current.actor.kind).toBe("observer"));

    act(() => result.current.registerGuest({ id: "guest-2", nickname: "Mia" }));
    rerender({ guests: [{ id: "guest-2", nickname: "Mia" }] });
    expect(result.current.actor).toEqual({ kind: "guest", guestId: "guest-2", nickname: "Mia" });
    expect(JSON.parse(window.localStorage.getItem("bgt-public-guest:event-token") ?? "{}").id)
      .toBe("guest-2");
  });

  it("treats malformed storage and storage access failures as an observer", async () => {
    window.localStorage.setItem("bgt-public-guest:event-token", "{");
    const { result, rerender } = renderHook(({ token }) => usePublicActor({
      token, user: null, guests: [{ id: "guest-1", nickname: "Alex" }], proposalIds: [],
    }), { initialProps: { token: "event-token" } });
    await waitFor(() => expect(result.current.actor.kind).toBe("observer"));

    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    rerender({ token: "other-event" });
    await waitFor(() => expect(result.current.actor.kind).toBe("observer"));
    getItem.mockRestore();
  });
});
