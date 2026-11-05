import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicProfileClient } from "@/app/public/profile/public-profile-client";

beforeEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/public/profile");
});

describe("PublicProfileClient", () => {
  it("shows unavailable state when no share token is present", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PublicProfileClient />);
    expect(await screen.findByRole("heading", { name: "Profil nicht verfügbar" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows unavailable and error responses without exposing failure details", async () => {
    window.history.replaceState(null, "", "/public/profile#secret-token");
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = render(<PublicProfileClient />);
    expect(await screen.findByRole("heading", { name: "Profil nicht verfügbar" })).toBeInTheDocument();
    first.unmount();

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    render(<PublicProfileClient />);
    expect(await screen.findByRole("heading", { name: "Profil konnte nicht geladen werden" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/public/profile", expect.objectContaining({ body: JSON.stringify({ token: "secret-token" }), cache: "no-store" }));
  });

  it("renders aggregate activity and selected badges, with a friendly empty state", async () => {
    window.history.replaceState(null, "", "/public/profile#token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ name: "Alex", totals: { sessions: 12, gamesPlayed: 8, seriesCompleted: 2 }, badges: [{ id: "first-session", title: "Erste Partie", description: "Losgespielt", altText: "Abzeichen: Erste Partie", icon: "spark" }, { id: "unknown", title: "Eigenes", description: "Beschreibung", altText: "Abzeichen: Eigenes", icon: "missing" }] }))
      .mockResolvedValueOnce(Response.json({ name: "Mia", totals: { sessions: 0, gamesPlayed: 0, seriesCompleted: 0 }, badges: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const first = render(<PublicProfileClient />);
    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByLabelText("Spielstatistik")).toHaveTextContent("12");
    expect(screen.getByRole("img", { name: "Abzeichen: Erste Partie" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Abzeichen: Eigenes" })).toBeInTheDocument();
    first.unmount();

    render(<PublicProfileClient />);
    expect(await screen.findByText("Noch keine Abzeichen ausgewählt.")).toBeInTheDocument();
  });

  it("shows a recoverable error after network or server failure", async () => {
    window.history.replaceState(null, "", "/public/profile#token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    render(<PublicProfileClient />);
    expect(await screen.findByRole("heading", { name: "Profil konnte nicht geladen werden" })).toBeInTheDocument();
  });
});
