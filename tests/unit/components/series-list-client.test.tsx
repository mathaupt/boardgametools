import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => <select aria-label={value === "alle" || value === "in_progress" || value === "komplett" || value === "leer" ? "Status filtern" : "Sortierung"} value={value} onChange={(e) => onValueChange(e.target.value)}>{(value === "alle" || value === "in_progress" || value === "komplett" || value === "leer" ? [["alle", "Alle"], ["in_progress", "In Arbeit"], ["komplett", "Komplett"], ["leer", "Noch leer"]] : [["name_asc", "Name (A–Z)"], ["name_desc", "Name (Z–A)"], ["progress_desc", "Fortschritt (hoch → niedrig)"], ["progress_asc", "Fortschritt (niedrig → hoch)"], ["entries_desc", "Meiste Spiele"], ["newest", "Neueste zuerst"], ["oldest", "Älteste zuerst"]]).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>,
  SelectTrigger: () => null, SelectValue: () => null, SelectContent: () => null, SelectItem: () => null,
}));
import SeriesListClient, { type GameSeriesItem } from "@/app/(dashboard)/dashboard/series/series-list-client";
const series = (id: string, name: string, entries: number, played: number, createdAt: string, description: string | null = null, imageUrl: string | null = null): GameSeriesItem => ({ id, name, description, imageUrl, createdAt, entries: entries ? [{ id: `${id}-entry`, played: played > 0, difficulty: null, game: { imageUrl: null } }] : [], _count: { entries, played } });
const items = [series("a", "Alpha", 2, 1, "2026-01-01", "Fantasy"), series("b", "Beta", 1, 1, "2026-02-01", null, "https://example.test/beta.jpg"), series("c", "Gamma", 0, 0, "2025-01-01")];
beforeEach(() => vi.clearAllMocks());

describe("SeriesListClient", () => {
  it("zeigt leere Sammlung und Reihen mit Bild, Collage, Fortschritt und Abschlussbadge", () => {
    const { rerender } = render(<SeriesListClient seriesList={[]} />);
    expect(screen.getByText("Noch keine Spielereihen")).toBeInTheDocument();
    rerender(<SeriesListClient seriesList={items} />);
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByAltText("Beta")).toHaveAttribute("src", "https://example.test/beta.jpg");
    expect(screen.getAllByText("Komplett").length).toBe(2); expect(screen.getByText("0 von 0 gespielt")).toBeInTheDocument();
    expect(screen.getByText("Noch keine Spiele")).toBeInTheDocument();
  });
  it("filtert Suche und Status und setzt aktive Filter zurück", async () => {
    const user = userEvent.setup(); render(<SeriesListClient seriesList={items} />);
    await user.type(screen.getByRole("textbox", { name: "Reihe suchen" }), "fantasy");
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument(); expect(screen.queryByRole("heading", { name: "Beta" })).not.toBeInTheDocument();
    expect(screen.getByText("1 von 3 Reihen")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suche leeren" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Status filtern" }), "komplett");
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument(); expect(screen.queryByRole("heading", { name: "Alpha" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filter zurücksetzen" }));
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
  });
  it("sortiert nach Fortschritt, Namen, Anzahl Spiele und Datum und zeigt keinen Treffer", async () => {
    const user = userEvent.setup(); render(<SeriesListClient seriesList={items} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "progress_desc");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Beta", "Alpha", "Gamma"]);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "oldest");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Gamma", "Alpha", "Beta"]);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sortierung" }), "name_desc");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Gamma", "Beta", "Alpha"]);
    await user.type(screen.getByRole("textbox", { name: "Reihe suchen" }), "nothing");
    expect(screen.getByRole("heading", { name: "Keine Treffer" })).toBeInTheDocument();
  });
});
