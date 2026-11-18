import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";
import { Navbar } from "@/components/layout/navbar";

const state = vi.hoisted(() => ({ path: "/dashboard/events/one", role: "USER" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Alex", role: state.role } } }),
  signOut: vi.fn(),
}));
vi.mock("next/link", () => ({ default: ({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} href={href} onClick={(event) => { event.preventDefault(); onClick?.(event); }} /> }));
afterEach(() => { cleanup(); state.role = "USER"; state.path = "/dashboard/events/one"; });

describe("Club navigation", () => {
  it("marks only the matching section on a nested route", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Spieleabende" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("shows five main destinations and groups secondary destinations under Mehr", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const nav = screen.getByRole("navigation", { name: "Hauptnavigation" });
    for (const label of ["Dashboard", "Spiele", "Sessions", "Spieleabende", "Gruppen"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    const more = screen.getByRole("button", { name: "Mehr" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(within(nav).getByRole("link", { name: "Reihen" })).toHaveAttribute("href", "/dashboard/series");
    expect(within(nav).getByRole("link", { name: "Statistiken" })).toHaveAttribute("href", "/dashboard/statistics");
    expect(within(nav).getByRole("link", { name: "Abzeichen" })).toHaveAttribute("href", "/dashboard/achievements");
  });

  it("marks an active secondary route on Mehr", async () => {
    state.path = "/dashboard/series/one";
    render(<Navbar />);
    const more = screen.getByRole("button", { name: "Mehr, Reihen" });
    expect(more).toHaveClass("is-active");
    await userEvent.setup().click(more);
    expect(screen.getByRole("link", { name: "Reihen" })).toHaveAttribute("aria-current", "page");
  });

  it("closes Mehr on Escape and returns focus to its toggle", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const more = screen.getByRole("button", { name: "Mehr" });
    await user.click(more);
    await user.keyboard("{Escape}");
    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(more).toHaveFocus();
  });

  it("closes the mobile menu on a second Escape after closing Mehr", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("button", { name: "Mehr" }));
    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Menü öffnen" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Menü öffnen" })).toHaveFocus();
  });

  it("opens a labelled mobile menu and closes it when a destination is chosen", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Menü schließen" })).toHaveAttribute("aria-expanded", "true");
    const gamesLink = screen.getByRole("link", { name: "Spiele" });
    // JSDOM cannot navigate full documents; keep this assertion focused on closing the menu.
    gamesLink.addEventListener("click", (event) => event.preventDefault());
    await user.click(gamesLink);
    expect(screen.getByRole("button", { name: "Menü öffnen" })).toHaveAttribute("aria-expanded", "false");
  });

  it("retains admin destinations for administrators", () => {
    state.role = "ADMIN";
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Nutzerverwaltung" })).toHaveAttribute("href", "/dashboard/admin/users");
    expect(screen.getByRole("link", { name: "Monitoring" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "API-Docs" })).toBeInTheDocument();
  });
});
