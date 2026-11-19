import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  cachedQuery: vi.fn((query: () => Promise<unknown>) => query()),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ default: { gameSession: { findMany: mocks.findMany, count: mocks.count } } }));
vi.mock("@/lib/cache", () => ({ cachedQuery: mocks.cachedQuery }));
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

beforeEach(() => {
  mocks.count.mockResolvedValue(0);
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
  it("lässt Aktionslinks bei schmaler Darstellung umbrechen und mindestens 44 px hoch", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([makeSession()]);

    render(await SessionsPage({ searchParams: Promise.resolve({}) }));

    const details = screen.getByRole("link", { name: "Details" });
    const edit = screen.getByRole("link", { name: "Bearbeiten" });
    expect(details.parentElement).toHaveClass("flex-wrap");
    expect(details).toHaveClass("min-h-11");
    expect(edit).toHaveClass("min-h-11");
  });

  it("renders each session's own cover and keeps the existing session links", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.count.mockResolvedValue(2);
    mocks.findMany.mockResolvedValue([
      makeSession(),
      makeSession({ id: "session-2", game: { id: "game-1", name: "Azul", imageUrl: null } }),
    ]);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const page = await SessionsPage({ searchParams: Promise.resolve({}) });
    const { container } = render(page);

    expect(screen.getAllByRole("heading", { name: "Azul" })).toHaveLength(2);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelectorAll("svg.lucide-dice-6")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Details" })[0]).toHaveAttribute("href", "/dashboard/sessions/session-1");
    expect(screen.getAllByRole("link", { name: "Bearbeiten" })[0]).toHaveAttribute("href", "/dashboard/sessions/session-1/edit");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdById: "owner-1", deletedAt: null },
      take: 20,
      skip: 0,
      orderBy: [{ playedAt: "desc" }, { id: "desc" }],
      include: expect.objectContaining({
        game: { select: { id: true, name: true, imageUrl: true } },
        players: { include: { user: { select: { id: true, name: true, email: true } } } },
      }),
    }));
    expect(consoleError.mock.calls.flat().some((entry) => String(entry).includes("cannot be a descendant"))).toBe(false);
  });

  it("shows a second page for more than 20 sessions and queries only the owner's requested page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.count.mockResolvedValue(21);
    mocks.findMany.mockResolvedValue([makeSession({ id: "session-21" })]);

    const page = await SessionsPage({ searchParams: Promise.resolve({ page: "2" }) });
    render(page);

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdById: "owner-1", deletedAt: null },
      skip: 20,
      take: 20,
      orderBy: [{ playedAt: "desc" }, { id: "desc" }],
    }));
    expect(mocks.count).toHaveBeenCalledWith({ where: { createdById: "owner-1", deletedAt: null } });
    expect(mocks.cachedQuery).toHaveBeenCalledWith(
      expect.any(Function),
      ["user-sessions-list", "owner-1", "page-2"],
      expect.any(Object),
    );
    expect(screen.getByRole("navigation", { name: "Seitennavigation der Sessions" })).toBeInTheDocument();
    expect(screen.getByText("Seite 2 von 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vorherige Seite" })).toHaveAttribute("href", "/dashboard/sessions?page=1");
  });

  it("links from the first page to the second page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.count.mockResolvedValue(21);
    mocks.findMany.mockResolvedValue(Array.from({ length: 20 }, (_, index) => makeSession({ id: `session-${index + 1}` })));

    render(await SessionsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Nächste Seite" })).toHaveAttribute("href", "/dashboard/sessions?page=2");
  });

  it("clamps an out-of-range page to the last available page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.count.mockResolvedValue(21);
    mocks.findMany.mockResolvedValue([makeSession({ id: "session-21" })]);

    render(await SessionsPage({ searchParams: Promise.resolve({ page: "999999999" }) }));

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20 }));
    expect(screen.getByText("Seite 2 von 2")).toBeInTheDocument();
  });

  it("does not query sessions without an authenticated owner", async () => {
    mocks.auth.mockResolvedValue({ user: {} });

    await expect(SessionsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("keeps an empty collection state", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([]);

    render(await SessionsPage({ searchParams: Promise.resolve({}) }));
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

    render(await SessionsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "BGG-Abenteuer" })).toBeInTheDocument();
    expect(screen.getByText(/Max \(Gast\)/)).toBeInTheDocument();
  });
});
