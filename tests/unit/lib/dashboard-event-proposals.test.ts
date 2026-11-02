import { describe, expect, it } from "vitest";
import { getTopDashboardProposalRanks, type DashboardProposalVoteCount } from "@/lib/dashboard-event-proposals";

const proposal = (
  id: string,
  votes: number,
  guestVotes = 0,
  createdAt = "2026-10-01T18:00:00.000Z",
): DashboardProposalVoteCount => ({
  id,
  votes,
  guestVotes,
  createdAt: new Date(createdAt),
});

describe("getTopDashboardProposalRanks", () => {
  it("sortiert nach Konto- und Gaststimmen zusammen und begrenzt auf drei", () => {
    const result = getTopDashboardProposalRanks([
      proposal("fourth", 2, 0),
      proposal("guest-winner", 0, 5),
      proposal("second", 3, 1),
      proposal("third", 2, 2),
      proposal("first", 4, 1),
    ]);

    expect(result.map(({ id, totalVotes }) => [id, totalVotes])).toEqual([
      ["first", 5],
      ["guest-winner", 5],
      ["second", 4],
    ]);
  });

  it("löst Gleichstände mit älterem Vorschlag und danach ID stabil auf", () => {
    const result = getTopDashboardProposalRanks([
      proposal("z", 2, 0, "2026-10-02T18:00:00.000Z"),
      proposal("b", 1, 1, "2026-10-01T18:00:00.000Z"),
      proposal("a", 2, 0, "2026-10-01T18:00:00.000Z"),
    ]);

    expect(result.map(({ id }) => id)).toEqual(["a", "b", "z"]);
  });

  it("sortiert gecachte ISO-Zeitstempel zusammen mit Prisma-Date-Werten", () => {
    const cachedProposals = [
      { id: "newer", votes: 2, guestVotes: 0, createdAt: "2026-10-02T18:00:00.000Z" },
      { id: "older", votes: 2, guestVotes: 0, createdAt: "2026-10-01T18:00:00.000Z" },
    ] as unknown as DashboardProposalVoteCount[];

    expect(getTopDashboardProposalRanks(cachedProposals).map(({ id }) => id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("liefert für null bis zwei Vorschläge alle vorhandenen Einträge", () => {
    expect(getTopDashboardProposalRanks([])).toEqual([]);
    expect(getTopDashboardProposalRanks([proposal("only", 0)])).toEqual([
      { id: "only", totalVotes: 0 },
    ]);
  });
});
