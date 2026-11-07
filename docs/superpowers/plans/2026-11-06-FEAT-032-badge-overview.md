# FEAT-032 – Abzeichenübersicht Implementation Plan

> **For agentic workers:** Use inline execution and the required RED-GREEN-REFACTOR workflow in `AGENTS.md`. Complete each checkbox step in order and recheck the plan freshness before implementation. Steps use checkbox syntax for tracking.

**Goal:** Make the existing private achievement catalogue easy to find from the profile and make each badge’s meaning, exact unlock condition, earned state, and private progress immediately understandable.

**Architecture:** Keep `/dashboard/achievements` as the single authenticated badge catalogue; FEAT-028 already provides its data, route, and main-navigation entry. Add a contextual link from the profile and render canonical unlock-condition copy from the existing badge definitions, without a new API, database field, or public-profile data path.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Lucide, Vitest/Testing Library, CodeceptJS/Playwright, Impeccable.

---

## Bestandsprüfung und Umfang

- **Aktualitätsprüfung vor Umsetzung:** 06.11.2026, HEAD `798dea2`. Seit der letzten Prüfung kamen keine Runtime-Commits hinzu. Die uncommitteten Dateien `docs/FEATURE-BACKLOG.md`, `src/lib/changelog.ts` und dieser Plan stammen aus der Planerstellung; die Implementierung berührt diese Inhalte gezielt. Badge-Katalog, Profilclient, private Übersicht und Navigationslink entsprechen weiter dem oben beschriebenen Bestand. Kein Planupdate an Architektur oder Umfang erforderlich.
- **Bereits vorhanden:** geschützte Route `/dashboard/achievements`, serverseitige Abfrage `AchievementService.getOverview(userId)`, sechs Badge-Definitionen mit stabilen IDs und Fortschrittszielen, Darstellung verdienter und noch erreichbarer Abzeichen sowie Link „Abzeichen“ in der Hauptnavigation.
- **Noch nicht klar genug:** Das Profil bietet keinen direkten Einstieg in die Übersicht. Die Beschreibung eines Abzeichens erklärt den Erfolg, nennt aber nicht für jedes Badge eine eigenständige, überprüfbare Freischaltbedingung.
- **Kanonische Regeln:** `src/lib/gamification/badges.ts` ist die einzige Quelle für Titel, Bedeutung, Freischaltbedingung, Zähler, Ziel und Icon. Die Seite darf keine Badge-Regeln duplizieren.
- **Bestätigter Umfang:** Web zuerst. Native iOS-Ansichten sind separat zu planen. Keine Ranglisten, keine öffentlichen Vorschritte und keine Änderung an der FEAT-028-Profilfreigabe.
- **Freigabe:** Am 06.11.2026 durch die ausdrückliche Anweisung „implementiere FEAT-032“ für den hier beschriebenen Web-Umfang erteilt. iOS, Datenbankänderungen, zusätzliche API-Routen und Änderungen an öffentlicher Profilfreigabe sind nicht umfasst.

## Dateien und Zuständigkeiten

- `src/lib/gamification/badges.ts`: Ergänzt pro Badge verständlichen, konkreten Bedingungstext und hält ihn neben Ziel und Metrik.
- `src/app/(dashboard)/dashboard/profile/profile-achievement-link.tsx` (neu): Kleine, responsive Profil-Verknüpfung zur bestehenden Übersicht.
- `src/app/(dashboard)/dashboard/profile/profile-client.tsx`: Platziert die Verknüpfung im Profil ohne Änderung der privaten Profildatenabfrage.
- `src/app/(dashboard)/dashboard/achievements/achievement-dashboard.tsx`: Benennt die Zustände eindeutig und zeigt Bedingung und privaten Fortschritt bei gesperrten sowie verdienten Badges.
- `src/app/club.css`: Hält die gemeinsame Navigation bei 200-%-Zoom im schmalen Viewport innerhalb der verfügbaren Breite.
- `tests/unit/lib/gamification/badges.test.ts`: Prüft Katalogvollständigkeit und Bedingungstexte.
- `tests/unit/components/profile-client.test.tsx` (neu): Prüft den zugänglichen Zieleintrag aus dem Profil.
- `tests/unit/components/achievement-dashboard.test.tsx`: Prüft Abschnittsüberschriften, Bedingungen, Status und Progress-Semantik.
- `tests/e2e/navigation_test.ts`: Ergänzt nur lesende Wege Profil → Abzeichenübersicht im Mobilviewport sowie eine Überlaufprüfung bei 200-%-Zoom.
- `docs/FEATURE-BACKLOG.md`, `docs/FEATURES.md`, `CONCEPT.md`, `src/lib/faq.ts`, `src/lib/changelog.ts`: Aktualisieren Beschreibung, Auffindbarkeit und Umsetzungsstatus. `docs/openapi.yaml` bleibt unverändert, da keine API hinzukommt.
- `.impeccable/critique/`: Speichert die Designprüfung und lokale Browser-/Detectorbelege.

## Umsetzungsaufgaben

### Task 1: Bedingungen als Teil des Badge-Katalogs festlegen

**RED:** `tests/unit/lib/gamification/badges.test.ts` um diese Vertragsprüfung ergänzen:

```ts
it("liefert für jedes Badge eine konkrete Freischaltbedingung", () => {
  const badges = evaluateBadgeProgress(stats());
  expect(badges).toHaveLength(6);
  expect(badges.map(({ id, unlockCondition }) => [id, unlockCondition])).toEqual([
    ["first-session", "Dokumentiere 1 nicht gelöschte Session als Ersteller."],
    ["sessions-10", "Dokumentiere 10 nicht gelöschte Sessions als Ersteller."],
    ["sessions-50", "Dokumentiere 50 nicht gelöschte Sessions als Ersteller."],
    ["games-5", "Spiele 5 verschiedene Spiele in nicht gelöschten Sessions selbst mit."],
    ["collection-game-first", "Spiele mindestens 1 Spiel aus deiner aktiven Sammlung selbst mit."],
    ["series-complete", "Markiere alle Spiele in mindestens 1 nicht gelöschten Spielreihe als gespielt."],
  ]);
});
```

Run: `npx vitest run tests/unit/lib/gamification/badges.test.ts`

Expected RED: Vitest runs but fails the non-empty condition assertions because `unlockCondition` is currently absent.

**GREEN:** Add `unlockCondition: string` to `BadgeDefinition`, and use explicit German conditions for every entry:

```ts
interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  unlockCondition: string;
  altText: string;
  target: number;
  icon: BadgeIcon;
  metric: keyof PersonalAchievementStats;
}
```

- `first-session`: „Dokumentiere 1 nicht gelöschte Session als Ersteller.“
- `sessions-10`: „Dokumentiere 10 nicht gelöschte Sessions als Ersteller.“
- `sessions-50`: „Dokumentiere 50 nicht gelöschte Sessions als Ersteller.“
- `games-5`: „Spiele 5 verschiedene Spiele in nicht gelöschten Sessions selbst mit.“
- `collection-game-first`: „Spiele mindestens 1 Spiel aus deiner aktiven Sammlung selbst mit.“
- `series-complete`: „Markiere alle Spiele in mindestens 1 nicht gelöschten Spielreihe als gespielt.“

Run: `npx vitest run tests/unit/lib/gamification/badges.test.ts`

Expected GREEN: all catalogue and threshold tests pass; every returned badge has a non-empty condition.

**REFACTOR:** Keep each condition adjacent to its `target` and `metric`; no second rule table or API-specific copy. Run the same test again and confirm it remains green.

### Task 2: Direkten Profileinstieg ergänzen

**RED:** Add `tests/unit/components/profile-client.test.tsx` for the existing profile component and its typed input contract:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileClient } from "@/app/(dashboard)/dashboard/profile/profile-client";

vi.mock("@/app/(dashboard)/dashboard/profile/profile-edit-form", () => ({ ProfileEditForm: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/password-change-form", () => ({ PasswordChangeForm: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/profile-activity-cards", () => ({ ProfileActivityCards: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/profile-messages-card", () => ({ ProfileMessagesCard: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/public-profile-settings", () => ({ PublicProfileSettings: () => null }));

it("offers the private badge catalogue directly from the profile", () => {
  render(<ProfileClient
    user={{ id: "user-1", name: "Alex", email: "alex@example.test", role: "USER", createdAt: "2026-01-01T00:00:00.000Z" }}
    invites={[]} events={[]} groups={[]} comments={[]} sessionNotes={[]}
  />);
  expect(screen.getByRole("link", { name: /Alle Abzeichen und ihre Freischaltbedingungen ansehen/i }))
    .toHaveAttribute("href", "/dashboard/achievements");
});
```

Mock only the five unrelated profile child components in this component test; render the real profile link and `ProfileClient`. Run: `npx vitest run tests/unit/components/profile-client.test.tsx`.

Expected RED: the test runs successfully but fails its link assertion because the current profile has no achievement link.

**GREEN:** Create `profile-achievement-link.tsx` as a small semantic `<Link>` with the destination `/dashboard/achievements`, visible text „Alle Abzeichen und ihre Freischaltbedingungen ansehen“, a Lucide `Award` icon marked `aria-hidden`, minimum 44 px height, visible focus ring, and existing semantic color tokens. Render it from `ProfileClient` after the profile header and before profile settings. Do not add badge/progress data to `ProfileClient` props.

```tsx
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

export function ProfileAchievementLink() {
  return (
    <Link
      href="/dashboard/achievements"
      className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Award className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 font-medium">Alle Abzeichen und ihre Freischaltbedingungen ansehen</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
```

Run: `npx vitest run tests/unit/components/profile-client.test.tsx`

Expected GREEN: the link has the expected accessible name and route.

**REFACTOR:** Keep the entry component under 50 lines and the existing `ProfileClient` under the project’s ~300-line limit. Run `npx vitest run tests/unit/components/profile-client.test.tsx tests/unit/components/club-navigation.test.tsx`.

### Task 3: Alle Badges mit Zustand, Bedingung und Fortschritt lesbar darstellen

**RED:** Extend `tests/unit/components/achievement-dashboard.test.tsx` to assert explicit „Freigeschaltet“ and „Noch nicht freigeschaltet“ group headings, the matching condition text for earned and locked badges, and an accessible progress label for locked badges. Assert that a completed badge is not rendered with a progress bar. Add the read-only E2E scenario in `tests/e2e/navigation_test.ts` now, before UI implementation: at 390 × 844 open `/dashboard/profile`, follow the profile link, then assert the page heading, both badge-state sections, all six titles and a visible unlock condition. It uses the existing E2E login fixture and performs no write. Run:

```ts
Scenario("The profile leads to every badge and its unlock condition", ({ I }) => {
  I.resizeWindow(390, 844);
  I.amOnPage("/dashboard/profile");
  I.click("Alle Abzeichen und ihre Freischaltbedingungen ansehen");
  I.waitForText("Meine Erfolge", 5);
  I.see("Freigeschaltet");
  I.see("Noch nicht freigeschaltet");
  I.see("Erste Spielrunde");
  I.see("Zehn gemeinsame Runden");
  I.see("Fünfzig Spielrunden");
  I.see("Fünf Spiele entdeckt");
  I.see("Sammlung auf dem Tisch");
  I.see("Reihe abgeschlossen");
  I.see("Freischaltbedingung");
});
```

```bash
npx vitest run tests/unit/components/achievement-dashboard.test.tsx
HEADLESS=true npm run test:e2e
```

Expected RED: unit assertions fail because the component omits conditions and clear state headings; E2E follows the profile link successfully but fails on the missing badge-state headings and condition copy.

**GREEN:** In `AchievementDashboard`, split the current earned and next-badge collections into clearly headed lists „Freigeschaltet“ and „Noch nicht freigeschaltet“. In each list item render badge title, meaning, and `unlockCondition` with the visible label „Freischaltbedingung“. For earned badges show a textual „Freigeschaltet“ status. For locked badges show an accessible `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`, a muted track, a primary-color fill, and the measured count with a grammatically correct unit phrase. Clamp the visual fill to the target. Do not show personal counts outside the authenticated achievement page. Keep badge icons decorative when adjacent text already conveys the title; preserve `prefers-reduced-motion` compatibility by adding no motion.

```tsx
function BadgeCondition({ badge }: { badge: BadgeProgress }) {
  return (
    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Freischaltbedingung: </span>
      {badge.unlockCondition}
    </p>
  );
}

// Use a semantic role=progressbar container with value attributes and a
// separately styled track/fill. Label units in dative context, for example
// „2 von 5 verschiedenen Spielen“ and „0 von 1 Session“.
```

Render `<BadgeCondition badge={badge} />` for both lists, followed by `<BadgeProgressState badge={badge} />`. Keep `unitForMetric` as the current metric-to-German-unit mapping; extract it to a named helper only if both list items need it.

Run: `npx vitest run tests/unit/components/achievement-dashboard.test.tsx`

Expected GREEN: earned/locked state, exact condition, and private progress assertions pass.

The E2E scenario written above must also pass now against the configured isolated E2E database:

```bash
HEADLESS=true npm run test:e2e
```

Expected: all navigation scenarios pass at the configured desktop and mobile sizes.

**REFACTOR:** Extract a small badge-list item only if the component approaches 300 lines; keep catalogue order stable and use token-based contrast in both themes. Run:

```bash
npx vitest run tests/unit/components/achievement-dashboard.test.tsx tests/unit/lib/gamification/badges.test.ts
```

Expected: both files pass without console or accessibility warnings.

### Task 4: Profilweg und schmale Ansicht im Browser abnehmen

**RED:** No additional runtime behavior is introduced in this task. The E2E regression scenario was written first and checked RED in Task 3 before the profile and badge UI changes.

**GREEN:** Keep the authenticated read-only route usable with all badge conditions at 390 × 844 and 1280 × 900, and no horizontal overflow.

**REFACTOR:** Inspect heading hierarchy, truncation, focus visibility, and progress labels at both viewports. Test 200 % zoom for horizontal overflow. Do not use production credentials or a production database.

### Task 5: Impeccable, Sicherheit und Dokumentation abschließen

**RED:** Capture the current component and profile route as a local baseline before changing the page. Existing behavior must remain owner-only; public profile tests must keep proving that locked badges and progress are not serialized.

**GREEN – Impeccable:** Load the current context for `src/app/(dashboard)/dashboard/achievements/achievement-dashboard.tsx`, run the design critique and detector, start the app locally against isolated test data, and inspect actual authenticated renders at 390 × 844 and 1280 × 900. Run detector scans on the local route at both viewport sizes. Resolve confirmed findings before acceptance and store the critique and screenshots under `.impeccable/critique/`.

**GREEN – Security/privacy:** No new endpoint or database permission is introduced. Verify the achievements page redirects unauthenticated users to `/login`; `AchievementService.getOverview(userId)` remains scoped to the signed-in user; no personal progress enters `PublicProfileService`; existing `tests/unit/api/public-profile.test.ts` and `tests/unit/components/public-profile-client.test.tsx` pass. No migration, deploy, or production-data operation is required.

**GREEN – Docs:** Update `docs/FEATURES.md` with the profile entry point and explicit earned/locked conditions; update `src/lib/faq.ts`, `CONCEPT.md`, and `docs/FEATURE-BACKLOG.md`; add the required German internal changelog entry. Keep API docs unchanged and mark FEAT-032 complete only after the browser, accessibility, privacy, and quality gates pass.

**REFACTOR / final verification:** Run:

```bash
npm run typecheck
npx eslint 'src/app/(dashboard)/dashboard/profile/profile-achievement-link.tsx' 'src/app/(dashboard)/dashboard/profile/profile-client.tsx' 'src/app/(dashboard)/dashboard/achievements/achievement-dashboard.tsx' src/lib/gamification/badges.ts tests/unit/lib/gamification/badges.test.ts tests/unit/components/profile-client.test.tsx tests/unit/components/achievement-dashboard.test.tsx tests/e2e/navigation_test.ts
npx vitest run tests/unit/lib/gamification/badges.test.ts tests/unit/components/profile-client.test.tsx tests/unit/components/achievement-dashboard.test.tsx tests/unit/components/club-navigation.test.tsx tests/unit/api/public-profile.test.ts tests/unit/components/public-profile-client.test.tsx
HEADLESS=true npm run test:e2e
npm run security-check:fast
npm run review-evaluate:regression
git diff --check
```

Expected: typecheck, targeted lint, unit and E2E tests, security check, detector and regression evaluator pass; `git diff --check` is clean. Commit the implementation only after these gates.

## Abnahme

- Ein angemeldeter Nutzer findet die Übersicht sowohl in der Hauptnavigation als auch direkt im Profil.
- Alle sechs katalogisierten Abzeichen sind sichtbar; jeder Eintrag benennt Bedeutung und konkrete Freischaltbedingung.
- Verdiente und noch nicht verdiente Abzeichen sind visuell und textlich unterscheidbar. Nur auf der privaten Seite wird der eigene Fortschritt gezeigt.
- 390-px-Ansicht, Tastatur, Screenreader-Labels, 200-%-Zoom und beide Farbthemen wurden gerendert geprüft.
- Gastansicht und öffentlich freigegebene Badge-Vitrine zeigen weiterhin ausschließlich ausdrücklich ausgewählte, verdiente Abzeichen; gesperrte Abzeichen und Fortschritt bleiben privat.
- Keine Datenbankmigration und keine native iOS-Änderung.

## Implementierungsfreigabe

**Status:** Am 07.11.2026 für den dokumentierten Web-Umfang umgesetzt und lokal abgenommen. Die vorgeschriebene Aktualitätsprüfung ist oben dokumentiert. Die gerenderte Prüfung fand zwei zusätzliche Probleme, die behoben wurden: der native Null-Fortschrittsbalken wirkte gefüllt und 200-%-Zoom verursachte Überlauf durch lange deutsche Wörter und die Navigation. Die Übersicht nutzt nun einen klaren Track/Füllstand, grammatisch korrekte Fortschrittsangaben, umbrechende Inhalte und eine platzsparende Wortmarke bei extrem schmaler effektiver Breite. Keine iOS-, Schema- oder API-Änderung.

**Abnahmenachweise:** Authentifizierte lokale Renderings bei 390 × 844 und 1280 × 900 liegen unter `.impeccable/critique/feat032/`. Zwei unabhängige Prüfer und der Detector auf den geänderten UI-Komponenten: keine offenen Befunde. Der Read-only E2E-Überlauftest bei 195 CSS-Pixeln (entspricht 390 px bei 200-%-Zoom) bestand; der Profilnavigationstest war bereits vorher grün, der letzte Wiederholungsversuch scheiterte an einem beendeten lokalen Devserver. Gezielte Unit-, Typ-, Lint- und Sicherheitsprüfungen bestanden. Regressionprüfung ist im Abschlussbericht dokumentiert.
