import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ default: { gameSession: { findMany: mocks.findMany } } }));
vi.mock("@/lib/cache", () => ({ cachedQuery: (query: () => Promise<unknown>) => query() }));
vi.mock("@/lib/cache-tags", () => ({ CacheTags: { userSessions: (id: string) => `user-sessions-${id}` } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => {
      const { fill: _fill, ...imageProps } = props;
      return React.createElement("img", imageProps);
    },
  };
});
vi.mock("next/link", async () => {
  const React = await import("react");
  const MockLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
    ({ href, children, ...props }, ref) => React.createElement("a", { ...props, href, ref }, children),
  );
  MockLink.displayName = "MockLink";
  return {
    default: MockLink,
  };
});

import SessionsPage from "@/app/(dashboard)/dashboard/sessions/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: "session-1",
  playedAt: new Date("2026-10-30T18:00:00Z"),
  durationMinutes: 60,
  notes: null,
  game: { id: "game-1", name: "Azul", imageUrl: "https://cf.geekdo-images.com/azul.jpg" },
  players: [],
  ...overrides,
});

describe("SessionsPage", () => {
  it("renders each session's own cover and keeps the existing session links", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([
      makeSession(),
      makeSession({ id: "session-2", game: { id: "game-1", name: "Azul", imageUrl: null } }),
    ]);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const page = await SessionsPage();
    const { container } = render(page);

    expect(screen.getAllByRole("heading", { name: "Azul" })).toHaveLength(2);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelectorAll("svg.lucide-dice-6")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Details" })[0]).toHaveAttribute("href", "/dashboard/sessions/session-1");
    expect(screen.getAllByRole("link", { name: "Bearbeiten" })[0]).toHaveAttribute("href", "/dashboard/sessions/session-1/edit");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdById: "owner-1", deletedAt: null },
      take: 20,
      orderBy: { playedAt: "desc" },
      include: expect.objectContaining({
        game: { select: { id: true, name: true, imageUrl: true } },
        players: { include: { user: { select: { id: true, name: true, email: true } } } },
      }),
    }));
    expect(consoleError.mock.calls.flat().some((entry) => String(entry).includes("cannot be a descendant"))).toBe(false);
  });

  it("does not query sessions without an authenticated owner", async () => {
    mocks.auth.mockResolvedValue({ user: {} });

    await expect(SessionsPage()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("keeps an empty collection state", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([]);

    render(await SessionsPage());
    expect(screen.getByRole("heading", { name: "Noch keine Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Erste Session eintragen" })).toHaveAttribute("href", "/dashboard/sessions/new");
  });

  it("shows snapshot-only event sessions with their guest participants", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([makeSession({
      game: null,
      gameNameSnapshot: "BGG-Abenteuer",
      gameImageUrlSnapshot: null,
      players: [],
      guestPlayers: [{ name: "Max", score: 8, placement: 1, isWinner: true }],
    })]);

    render(await SessionsPage());

    expect(screen.getByRole("heading", { name: "BGG-Abenteuer" })).toBeInTheDocument();
    expect(screen.getByText(/Max \(Gast\)/)).toBeInTheDocument();
  });
});
