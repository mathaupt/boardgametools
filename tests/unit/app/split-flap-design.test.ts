import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globals = readFileSync("src/app/globals.css", "utf8");
const club = readFileSync("src/app/club.css", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");

describe("Split-Flap-Webgestaltung", () => {
  it("stellt die bestätigten Anzeigetafel-Farbrollen und Datumsdarstellung bereit", () => {
    expect(globals).toContain("--background: #0b0b0d");
    expect(globals).toContain("--accent: #ffb000");
    expect(globals).toContain("--input:#5b5e63");
    expect(layout).toContain('variable: "--font-barlow-condensed"');
    expect(club).toContain("font-family:var(--font-barlow-condensed)");
    expect(club).toContain(".club-event-feature::before");
    expect(club).toContain("var(--border) 4.5rem 100%");
    expect(club).toContain(".club-date");
    expect(club).toContain("linear-gradient");
    expect(club).toContain("prefers-reduced-motion:reduce");
  });
});
