import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
const cardLoaders = import.meta.glob("../../../src/app/(dashboard)/dashboard/events/[id]/played-sessions-card.tsx");

const props: { eventId: string; eventDate: string; proposals: { id: string; gameName: string; imageUrl: string | null; playedSessions: { id: string; session: any }[] }[]; participants: { id: string; name: string; kind: "user" | "guest" }[]; isCreator: boolean } = {
  eventId: "event-1",
  eventDate: "2026-11-04T18:00:00.000Z",
  proposals: [{ id: "proposal-1", gameName: "Catan", imageUrl: null, playedSessions: [] }],
  participants: [{ id: "user-1", name: "Anna", kind: "user" as const }, { id: "guest-1", name: "Max (Gast)", kind: "guest" as const }],
  isCreator: false,
};

describe("PlayedSessionsCard", () => {
  it("names the winner control for the selected participant", async () => {
    const loader = Object.values(cardLoaders)[0];
    if (!loader) return;
    const featureModule = await loader() as { PlayedSessionsCard: React.ComponentType<typeof props> };
    render(<featureModule.PlayedSessionsCard {...props} isCreator />);
    fireEvent.click(screen.getByRole("button", { name: /Partie erfassen/i }));
    expect(await screen.findByRole("checkbox", { name: "Gewinner für Anna" })).toBeInTheDocument();
  });

  it("shows the played status and detailed session only to authorized event viewers", async () => {
    const loader = Object.values(cardLoaders)[0];
    expect(loader).toBeDefined();
    if (!loader) return;
    const featureModule = await loader() as { PlayedSessionsCard: React.ComponentType<typeof props> };
    render(<featureModule.PlayedSessionsCard {...props} proposals={[{
      ...props.proposals[0],
      playedSessions: [{ id: "link-1", session: {
        id: "session-1", playedAt: "2026-11-04T18:00:00.000Z", durationMinutes: 80, notes: "Taktikrunde",
        players: [{ user: { name: "Anna" }, score: 9, placement: 1, isWinner: true }],
        guestPlayers: [{ name: "Max", score: 4, placement: 2, isWinner: false }],
      } }],
    }]} />);

    expect(screen.getByText("Gespielte Partien")).toBeInTheDocument();
    expect(screen.getByText("Gespielt")).toBeInTheDocument();
    expect(screen.getByText("Taktikrunde")).toBeInTheDocument();
    expect(screen.getByText("Max (Gast)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Partie erfassen/i })).not.toBeInTheDocument();
  });
});
