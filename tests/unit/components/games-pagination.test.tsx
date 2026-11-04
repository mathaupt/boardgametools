import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

import { GamesPagination } from "@/app/(dashboard)/dashboard/games/games-pagination";

describe("GamesPagination", () => {
  it("shows the count and preserves active filters while navigating pages", () => {
    render(<GamesPagination page={2} totalPages={3} total={61} query={{
      page: 2, limit: 24, search: "Catan", tagId: "strategy", players: 4, minComplexity: 3, sort: "newest",
    }} />);

    expect(screen.getByText("Seite 2 von 3" )).toBeInTheDocument();
    expect(screen.getByText("25–48 von 61 Spielen")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vorherige Seite" })).toHaveAttribute("href", "/dashboard/games?q=Catan&tag=strategy&players=4&complexity=3&sort=newest");
    expect(screen.getByRole("link", { name: "Nächste Seite" })).toHaveAttribute("href", "/dashboard/games?page=3&q=Catan&tag=strategy&players=4&complexity=3&sort=newest");
  });

  it("disables navigation at the first and last page", () => {
    const { rerender } = render(<GamesPagination page={1} totalPages={1} total={1} query={{
      page: 1, limit: 24, search: "", tagId: null, players: null, minComplexity: null, sort: "name_asc",
    }} />);
    expect(screen.getByRole("button", { name: "Vorherige Seite" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Nächste Seite" })).toBeDisabled();
    rerender(<GamesPagination page={2} totalPages={2} total={25} query={{
      page: 2, limit: 24, search: "", tagId: null, players: null, minComplexity: null, sort: "name_asc",
    }} />);
    expect(screen.getByRole("button", { name: "Nächste Seite" })).toBeDisabled();
  });
});
