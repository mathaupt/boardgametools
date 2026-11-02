# FEAT-020 – Kontrast der öffentlichen Spielvorschläge: Implementierungsplan

> **Für ausführende Agenten:** Aufgaben einzeln bearbeiten; bei Laufzeitänderungen RED → GREEN → REFACTOR belegen. Dieser Plan erteilt keine Umsetzungsfreigabe.

**Ziel:** BGG- und Sammlungstreffer auf der öffentlichen Eventseite erhalten eine klar lesbare, themefähige Kartenfläche.

**Architektur:** Die Oberfläche bleibt unverändert aufgebaut. Nur die beiden Ergebniszeilen ersetzen die halbtransparente `background`-Fläche durch semantische `card`-Farben und einen klaren Border. Tests sichern die Klassenrollen in beiden getrennten Ergebnisquellen.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS 4, Vitest und Testing Library.

**Design-Spec:** [Lesbare Spielvorschläge auf der öffentlichen Eventseite](../specs/2026-11-02-public-event-proposal-contrast-design.md).

---

## Bestand und Aktualitätsprüfung

Am 02.11.2026 gegen Commit `b7403a1` geprüft:

- `src/components/public-event/bgg-search-results.tsx` rendert BGG-Treffer als `li` mit `border-border/60 bg-background/80`.
- `src/components/public-event/collection-game-proposer.tsx` rendert Sammlungstreffer als `div` mit derselben halbtransparenten Hintergrundrolle.
- Die äußeren Suchkarten verwenden ebenfalls `bg-background/70`; dadurch liegen die Trefferflächen farblich zu nah am Suchbereich.
- Produkt- und Designvorgabe ist Club Programme mit semantischen Themefarben. Namen, Metadaten und Aktionen nutzen bereits die passenden Text-/Buttonrollen.
- Kein API-, Datenbank- oder Berechtigungsumfang. Beide Komponenten sind Client Components; die Änderung betrifft nur Klassen.

**Aktualitätsprüfung vor Umsetzung 02.11.2026:** Gegen Commit `caa78ae` und
den aktuellen Arbeitsstand geprüft. Seit Erstellung des Plans gab es keine
Änderung an den öffentlichen Suchkomponenten oder den Farb-Tokens. `--card` und
`--card-foreground` sind sowohl für Hell- als auch Dunkel-Theme definiert.
Beide Zeilen verwenden weiterhin die in der Spec benannten halbtransparenten
`background`-Farben. Der Plan ist aktuell. Der Nutzer hat die Umsetzung durch
„implementiere FEAT-020“ am 02.11.2026 freigegeben.

## Feste Gestaltungsentscheidung

Die beiden Trefferzeilen erhalten `border-border bg-card text-card-foreground`.
Die vorhandene Border-Breite, Rundung, Innenabstände, Bilder, Inhalte und
Aktionen bleiben erhalten. Keine Akzentfarbe, keine Schatten und keine neue
Komponente hinzufügen. Die semantischen Tokens müssen Light und Dark Theme
unterstützen.

## Aufgaben

### Task 1: Beide Ergebnisoberflächen testgetrieben absichern

**Dateien:**

- Erstellen: `tests/unit/components/public-event-proposal-surfaces.test.tsx`
- Lesen: `src/components/public-event/bgg-search-results.tsx`
- Lesen: `src/components/public-event/collection-game-proposer.tsx`

- [x] **Schritt 1: Verhaltenstest für BGG-Treffer schreiben.** `BggSearchResults` mit einem Bild-losen Treffer rendern und prüfen, dass die Trefferzeile `border-border`, `bg-card` und `text-card-foreground` verwendet.

```tsx
const row = screen.getByRole("list", { name: "Suchergebnisse" }).querySelector("li");
expect(row).toHaveClass("border-border", "bg-card", "text-card-foreground");
```

- [x] **Schritt 2: Verhaltenstest für Sammlungstreffer schreiben.** `/api/games` mit einem Sammlungsspiel stubben, `CollectionGameProposer` rendern, auf den Spielnamen warten und dieselben drei semantischen Klassen auf der Trefferzeile prüfen.

```tsx
const row = (await screen.findByText("Catan")).parentElement?.parentElement;
expect(row).toHaveClass("border-border", "bg-card", "text-card-foreground");
```

- [x] **Schritt 3: RED prüfen.** Beide Fälle scheiterten an den fehlenden semantischen Klassen; Rendering und Mocks waren korrekt.

### Task 2: Semantische Kartenflächen einsetzen

**Dateien:**

- Ändern: `src/components/public-event/bgg-search-results.tsx`
- Ändern: `src/components/public-event/collection-game-proposer.tsx`

- [x] **Schritt 1: BGG-Trefferfläche austauschen.** Auf dem `li` `border-border/60 bg-background/80` durch `border-border bg-card text-card-foreground` ersetzen; übrige Klassen unverändert lassen.
- [x] **Schritt 2: Sammlungstrefferfläche austauschen.** Auf dem Treffer-`div` `border-border/60 bg-background/80` durch `border-border bg-card text-card-foreground` ersetzen; übrige Klassen unverändert lassen.
- [x] **Schritt 3: GREEN prüfen.** Beide neuen Darstellungstests bestanden.

### Task 3: Qualitäts- und Oberflächenabnahme

**Dateien:**

- Ändern: `docs/FEATURE-BACKLOG.md` (Status erst nach Umsetzung aktualisieren)
- Ändern: `docs/FEATURES.md` (Darstellung der öffentlichen Vorschlagslisten dokumentieren)
- Ändern: `src/lib/changelog.ts` (Umsetzungseintrag vervollständigen)
- Prüfen: `docs/superpowers/specs/2026-11-02-public-event-proposal-contrast-design.md`

- [x] **Schritt 1: Gezielte Tests ausführen.** Neue Flächentests und angrenzende Public-Event-Suiten: 6/6 bestanden.
- [x] **Schritt 2: Statische Prüfungen ausführen.** Gezieltes ESLint, TypeScript und Produktionsbuild bestanden.
- [x] **Schritt 3: Impeccable statisch prüfen.** 0 Regex-Findings; Detektor weist darauf hin, dass Regeln für gerenderte Seiten nicht liefen. Security-Check erfolgt über den Commit-Hook.
- [x] **Schritt 4: Theme-/Viewportabnahme versuchen.** Browserhost meldet `The browser access host is unavailable`; keine gerenderte Light/Dark- oder Viewportabnahme behauptet.
- [x] **Schritt 5: Feature- und Review-Dokumentation abschließen.** Backlog, Feature-Doku, Changelog, Review-Snapshot, Bewertung und Prozessnotizen mit tatsächlichen Ergebnissen aktualisiert.
- [ ] **Schritt 6: Commit und Regressionsevaluator.** Änderungen committen; Pre-Commit-Tests, Security-Check und `npm run review-evaluate:regression` müssen ohne neue Findings oder Regressionen enden.

**Bisheriger Prüfnachweis:** RED für beide Fälle beobachtet, danach neue
Darstellungstests und angrenzende Public-Event-Tests 6/6 bestanden. TypeScript,
gezieltes ESLint und Produktionsbuild bestanden. Keine API-, Schema- oder
Datenbankänderung. Gerenderte Theme-/Viewportabnahme wegen nicht verfügbarem
Browserhost offen.

## Abnahmekriterien

- Beide Trefferlisten verwenden deckende `card`-Flächen und sichtbare Borders, passend zum jeweiligen Theme.
- Namen, Metadaten, Bilder, Suchzustände, Aktionen und Vorschlagsverhalten bleiben unverändert.
- Beide Darstellungstests und die angrenzenden Public-Event-Tests bestehen.
- TypeScript, ESLint, Build, Security-Check und Regressionsevaluator sind dokumentiert.
- Browserprüfung von Light/Dark und schmaler/breiter Ansicht ist erledigt oder mit konkreter Einschränkung offen ausgewiesen.

## Freigabe

Designrichtung durch „ja“ am 02.11.2026 bestätigt. Design-Spec am selben Tag
geprüft. **Web-Umsetzung am 02.11.2026 durch „implementiere FEAT-020“
freigegeben.** iOS ist nicht betroffen.
