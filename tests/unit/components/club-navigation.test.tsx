import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
afterEach(() => { cleanup(); state.role = "USER"; });

describe("Club navigation", () => {
  it("marks only the matching section on a nested route", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("opens a labelled mobile menu and closes it when a destination is chosen", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Menü schließen" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("link", { name: "Spiele" }));
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
