import { describe, expect, it } from "vitest";
import { proposalRanks, sortProposals } from "@/lib/voting/sort-proposals";
import type { VotingProposal } from "@/lib/voting/types";

function proposal(input: Partial<VotingProposal> & Pick<VotingProposal, "id" | "name">): VotingProposal {
  const { id, name, ...overrides } = input;
  return {
    id,
    name,
    createdAt: null,
    voteCounts: { registered: 0, guests: 0 },
    totalVotes: 0,
    ...overrides,
  };
}

describe("sortProposals", () => {
  const items = [
    proposal({ id: "azul", name: "Azul", createdAt: "2026-10-01T00:00:00Z", voteCounts: { registered: 2, guests: 0 }, totalVotes: 2 }),
    proposal({ id: "cascadia", name: "Cascadia", createdAt: "2026-10-02T00:00:00Z", voteCounts: { registered: 1, guests: 4 }, totalVotes: 5 }),
    proposal({ id: "catan", name: "Catan", createdAt: "2026-10-02T00:00:00Z", voteCounts: { registered: 3, guests: 2 }, totalVotes: 5 }),
  ];

  it("sorts by combined registered and guest votes with stable ties", () => {
    expect(sortProposals(items, "votes").map((item) => item.id)).toEqual(["cascadia", "catan", "azul"]);
  });

  it("sorts names using German numeric comparison", () => {
    const numeric = [proposal({ id: "10", name: "Spiel 10" }), proposal({ id: "2", name: "Spiel 2" })];
    expect(sortProposals(numeric, "name").map((item) => item.id)).toEqual(["2", "10"]);
  });

  it("sorts newest first and treats missing timestamps as oldest", () => {
    const values = [items[1], proposal({ id: "old", name: "Old" }), items[0]];
    expect(sortProposals(values, "newest").map((item) => item.id)).toEqual(["cascadia", "azul", "old"]);
  });

  it("does not mutate the supplied array", () => {
    const original = [...items];
    sortProposals(items, "name");
    expect(items).toEqual(original);
  });
});

describe("proposalRanks", () => {
  it("gives equal vote totals the same rank and leaves gaps after ties", () => {
    const ranks = proposalRanks([
      proposal({ id: "one", name: "One", totalVotes: 5 }),
      proposal({ id: "two", name: "Two", totalVotes: 5 }),
      proposal({ id: "three", name: "Three", totalVotes: 2 }),
    ]);
    expect([...ranks]).toEqual([["one", 1], ["two", 1], ["three", 3]]);
  });
});
