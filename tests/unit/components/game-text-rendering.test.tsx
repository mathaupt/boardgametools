import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CollectionGameCard } from "@/app/(dashboard)/dashboard/games/collection-game-card";

afterEach(cleanup);

describe("game text rendering", () => {
  it("shows decoded entity strings as text without creating markup elements", () => {
    render(<CollectionGameCard game={{
      id: "game-1",
      name: "&lt;img src=x onerror=alert(1)&gt;",
      description: "&lt;script&gt;alert(1)&lt;/script&gt;",
      imageUrl: null,
      minPlayers: 1,
      maxPlayers: 4,
      playTimeMinutes: null,
      complexity: null,
      bggId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      _count: { sessions: 0 },
    }} />);
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(document.querySelector("img, script")).toBeNull();
  });
});
