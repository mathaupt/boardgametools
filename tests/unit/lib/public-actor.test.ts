import { describe, expect, it } from "vitest";
import { resolvePublicActor, resolveProposalAuthor } from "@/lib/events/public-actor";

describe("resolvePublicActor", () => {
  const guests = [{ id: "g1", nickname: "Alex" }];

  it("priorisiert das Konto vor einem gespeicherten Gast", () => {
    expect(resolvePublicActor({
      user: { id: "u1", name: "Anna" },
      hydrated: false,
      storedGuest: { id: "g1", nickname: "Alex" },
      guests,
    })).toEqual({ kind: "user", userId: "u1", displayName: "Anna" });
  });

  it("zeigt während der anonymen Hydration keine Aktion", () => {
    expect(resolvePublicActor({ user: null, hydrated: false, storedGuest: null, guests }))
      .toEqual({ kind: "loading" });
  });

  it("verwendet nur einen im aktuellen Event vorhandenen Gast und den Servernamen", () => {
    expect(resolvePublicActor({
      user: null,
      hydrated: true,
      storedGuest: { id: "g1", nickname: "Veralteter Name" },
      guests: [{ id: "g1", nickname: "Aktueller Name" }],
    })).toEqual({ kind: "guest", guestId: "g1", nickname: "Aktueller Name" });
  });

  it("lässt fehlende oder eventfremde Gastzustände im Beobachterzustand", () => {
    expect(resolvePublicActor({
      user: null,
      hydrated: true,
      storedGuest: { id: "foreign", nickname: "Alex" },
      guests,
    })).toEqual({ kind: "observer" });
  });
});

describe("resolveProposalAuthor", () => {
  it("assigns one author relation and prioritizes a session over a legacy guest id", () => {
    expect(resolveProposalAuthor("user-1", "guest-1")).toEqual({
      proposedById: "user-1",
      guestId: null,
    });
  });

  it("uses a guest relation only when no account session exists", () => {
    expect(resolveProposalAuthor(null, "guest-1")).toEqual({
      proposedById: null,
      guestId: "guest-1",
    });
  });
});
