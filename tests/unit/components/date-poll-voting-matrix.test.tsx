import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateVotingMatrix } from "@/app/(dashboard)/dashboard/events/[id]/date-poll-voting-matrix";

const proposal = {
  id: "dp-1",
  date: "2026-11-06T00:00:00.000Z",
  votes: [
    { id: "v1", availability: "yes", user: { id: "u1", name: "Ada", email: "ada@example.com" } },
    { id: "v2", availability: "legacy", user: { id: "u2", name: "Lin", email: "lin@example.com" } },
  ],
  guestVotes: [{ id: "gv1", availability: "maybe", guest: { id: "g1", nickname: "Kai" } }],
};

describe("DateVotingMatrix", () => {
  it("presents comparison answers as text and never duplicates interactive voting controls", () => {
    render(<DateVotingMatrix proposals={[proposal]} />);

    expect(screen.getByRole("table", { name: "Teilnehmerantworten nach Termin" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Kai (Gast)" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ja" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Vielleicht" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Antwort unbekannt" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
  });
});
