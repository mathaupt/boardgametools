# FEAT-016 – Durchsuchbare Spielauswahl bei der Session-Anlage

> **Für ausführende Agenten:** Aufgaben einzeln bearbeiten; bei Laufzeitänderungen RED → GREEN → REFACTOR belegen. Die Web-Umsetzung wurde am 02.11.2026 durch „implementiere FEAT-016“ freigegeben.

**Ziel:** Ein Spiel aus der eigenen Sammlung im Webformular `/dashboard/sessions/new` durch Eingabe eines Namens finden und verbindlich auswählen.

**Architektur:** Ein fokussierter Client-Picker ersetzt ausschließlich die Spielauswahl. Der Server liefert weiterhin die alphabetisch sortierte eigene Sammlung. Ein reiner Filter verarbeitet bereits geladene Namen; der Picker übergibt ausschließlich eine gewählte Spiel-ID an das Formular.

**Stack:** Next.js App Router, TypeScript, React, vorhandenes `radix-ui`-Popover, bestehende Button-/Input-Primitiven, Vitest/Testing Library, jest-axe.

## Ausgangsstand und Aktualitätsprüfung

Am 02.11.2026 gegen Commit `80d770d` und die aktuellen Quellen geprüft:

- `src/app/(dashboard)/dashboard/sessions/new/page.tsx` liest eigene, nicht gelöschte Spiele; die Abfrage sortiert nach Namen und liefert ID, Namen, Bild-URL und Spielerbereich.
- `session-form-client.tsx` verwendet ein Radix-Select ohne sichtbare Texteingabe. Mitspieler verwenden separate Selects.
- `src/lib/services/session.service.ts` prüft beim Erstellen Besitz und Löschstatus des Spiels. Diese serverseitige Prüfung bleibt maßgeblich.
- `radix-ui` ist vorhanden; `cmdk`, ein Command-Primitiv und ein eigener Combobox-Baustein sind nicht vorhanden. Das Radix-Popover-Primitiv ist verfügbar, ein gemeinsamer Wrapper in `src/components/ui/popover.tsx` fehlt noch. Eine neue Paketabhängigkeit ist nicht erforderlich.
- iOS verwendet in `BoardGameTools/BoardGameTools/Views/SessionEditView.swift` einen nativen Picker ohne `.searchable`. Eine iOS-Suchauswahl ist ein eigener späterer Plan.

**Aktualitätsprüfung vor Umsetzung 02.11.2026:** Gegen Commit `14271bb` und den nachfolgenden Arbeitsstand geprüft. FEAT-017 hat die Sessions-Übersicht mit Covern ergänzt; FEAT-018 hat Test-Governance und Coverage-Planung ergänzt. Beide ändern die Session-Anlage, Spielauswahl, API oder Berechtigungen nicht. Die Serverabfrage bleibt eigentumsgebunden und nach Namen sortiert; die Serviceprüfung bleibt maßgeblich. Es gibt weiterhin keinen Picker und keine zugehörigen Picker-/Formulartests. Abweichung zum ursprünglichen Plan: Es existiert keine UI-Popover-Hülle, daher wird eine kleine gemeinsame Hülle auf Basis des vorhandenen Radix-Primitivs ergänzt. Der übrige Plan bleibt aktuell.

## Empfohlener Bedienablauf und Alternativen

**Planungsannahme:** Eine Schaltfläche „Spiel auswählen…“ öffnet ein Popover mit Suchfeld und Trefferliste. Das ist ein Vorschlag für die Planfreigabe, keine bereits bestätigte neue Designentscheidung. Die Oberfläche folgt Club Programme, Modus Operate.

| Ansatz | Bewertung |
|---|---|
| Popover mit Suchfeld und Listbox | Empfohlen: ein Feld im Formular, sichtbare Suchmöglichkeit und klare ID-Auswahl; Tastaturführung muss explizit geprüft werden. |
| Dauerhaftes Suchfeld plus gefiltertes Select | Weniger eigene Tastatursteuerung, benötigt aber zwei Steuerelemente und eine klare Trennung zwischen Filter und Auswahl. |
| Native `datalist` | Keine verlässliche Darstellung von Treffer-/Leerzuständen und keine verbindliche Bindung an eine Spiel-ID; hier nicht gewählt. |

Der Picker zeigt Spielname und Spielerbereich. Keine Cover oder BGG-Suche ergänzen. Eine Auswahl schließt die Liste und zeigt den gewählten Namen. Der Suchtext wird beim Schließen verworfen; die Auswahl bleibt erhalten. „Suche leeren“ entfernt nur den Filter. Beide Spiele mit identischem Namen bleiben als getrennte Optionen mit ihren IDs erhalten.

## Zustände und Interaktionen

| Zustand/Aktion | Vertrag |
|---|---|
| Öffnen | Fokus im Suchfeld; bestehende Auswahl als aktiv markieren, sonst erster Treffer. |
| Eingabe | Unmittelbare lokale Teilnamensuche; Groß-/Kleinschreibung und diakritische Varianten werden normalisiert. |
| Suchbegriffe | `MÜHLE` und `muhle` finden „Mühle“; `strasse` findet „Straße“; HTML-Entities werden wie angezeigte Namen gelesen. |
| Pfeiltasten | Aktive Option wechseln, aktive Option in den sichtbaren Listenausschnitt scrollen; Fokus bleibt im Suchfeld. |
| Enter | Nur aktive gültige Option wählen; bei keinem Treffer oder laufender IME-Komposition keine Auswahl und kein Formular-Submit. |
| Escape/außerhalb klicken | Schließen ohne Auswahländerung; Fokus bei Escape zurück zum Auslöser. |
| Tab | Popover schließen und normal zum nächsten Formularfeld gehen; kein Fokusfang am Auslöser. |
| Home/End | Die normale Cursorsteuerung des Suchfelds erhalten. |
| Kein Treffer | „Keine passenden Spiele gefunden.“ und eine erreichbare Aktion zum Leeren der Suche. |
| Leere Sammlung | „Noch keine Spiele in deiner Sammlung.“ mit Link `/dashboard/games/new`; Speichern ohne gültige Spiel-ID verhindern. |
| Auswahl veraltet | Ist die gewählte ID nicht mehr in den übergebenen Optionen, vor dem Senden eine erneute Auswahl verlangen. |

Suchfeld, Listbox, aktive Option und Fehler werden programmatisch verbunden (`aria-controls`, `aria-activedescendant`, `aria-selected`, `aria-invalid`, `aria-describedby`). Trefferanzahl als höfliche Statusmeldung ausgeben. Optionen enthalten keine weiteren fokussierbaren Aktionen. Namen werden als Text gerendert.

## Dateiverantwortungen

| Datei | Änderung |
|---|---|
| `src/components/ui/popover.tsx` | Schlanke gemeinsame Hülle des installierten Radix-Popover-Primitivs; keine neue Paketabhängigkeit. |
| `src/components/sessions/session-game-options.ts` | Typ `SessionGameOption`, Normalisierung und unverändernder Filter. |
| `src/components/sessions/session-game-picker.tsx` | Popover, lokaler Filterzustand, Listbox und Tastatur-/Fokussteuerung; unter 300 Zeilen. |
| `src/app/(dashboard)/dashboard/sessions/new/session-form-client.tsx` | Picker anbinden; gültige ID vor `fetch` prüfen, Feldfehler zeigen und Fokus zum Picker setzen. |
| `tests/unit/components/session-game-picker.test.tsx` | Nutzerverhalten des Pickers. |
| `tests/unit/lib/session-game-options.test.ts` | Filter- und Normalisierungsvertrag. |
| `tests/unit/components/session-form-client.test.tsx` | ID-Bindung, Submit und Fehlerrückmeldung. |

Der Picker erhält `games`, `value`, `onValueChange`, `id`, `disabled` und optionale Fehlerbeschreibung. `onValueChange` wird ausschließlich nach einer gültigen Optionsauswahl aufgerufen. Der Query-Text ist kein Formularwert. Bestehende Serverabfrage, Mitspielerfelder und API-Verträge bleiben beim aktuellen Umfang.

## Schrittweise Umsetzung

### 1. Reinen Filter testgetrieben erstellen

- [x] In `tests/unit/lib/session-game-options.test.ts` einen Verhaltenstest schreiben:

```ts
import { expect, it } from "vitest";
import { filterSessionGames } from "@/components/sessions/session-game-options";

it("findet Umlaute und erhält die Optionsreihenfolge", () => {
  const games = [
    { id: "a", name: "Mühle", imageUrl: null, minPlayers: 2, maxPlayers: 2 },
    { id: "b", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 },
  ];
  expect(filterSessionGames(games, " MUHLE ").map(g => g.id)).toEqual(["a"]);
  expect(filterSessionGames(games, "")).toEqual(games);
  expect(games.map(g => g.id)).toEqual(["a", "b"]);
});
```

- [x] RED fachlich verifizieren; dann Filter ergänzen. Import-/Syntaxfehler wurden nicht als RED-Nachweis gezählt.
- [x] Typ und Filter in `session-game-options.ts` ergänzen. Normalisierung nutzt `gameTextForRead`, Unicode-NFD, entfernt kombinierende Zeichen, normalisiert deutsche Kleinschreibung sowie `ß` → `ss` und Rand-Leerraum. Leere Query erhält die Reihenfolge ohne In-place-Sortieren.
- [x] Teilsuche, Entities, Leerzeichen, „Straße“, keine Treffer und doppelte Namen ergänzen; alle Filtertests grün.

### 2. Picker mit Tastatur- und Statusvertrag erstellen

- [x] Interaktionstests zuerst schreiben: Öffnen, Fokus, Filterung, Klick-/Tastaturauswahl, Escape, Tab, Leeren, IME und Enter ohne Treffer.
- [x] RED für den fehlenden Picker und die Interaktionen verifiziert.
- [x] Picker mit einer gemeinsamen Hülle des `radix-ui`-Popover-Primitivs und den vorhandenen `Button`/`Input` entwickelt; kein verschachteltes Radix-Select.
- [x] ARIA-Feld-/Statusbeziehungen und `jest-axe` geprüft; leere Sammlung und 1.000 lokale Optionen getestet, ohne Trefferlimit.
- [x] Tests grün ausgeführt; der Picker bleibt unter 300 Zeilen.

### 3. Formularintegration absichern

- [x] Formular-RED für fehlende und veraltete Spiel-IDs verifiziert; ungültige ID verhindert `fetch` und setzt einen fokussierbaren Fehler.
- [x] Erfolgreiche Auswahl sendet nur `gameId`; der bestehende Payload für Datum, Dauer, Notizen und Mitspieler bleibt erhalten.
- [x] Picker integrieren und ID-Zugehörigkeit vor dem Speichern prüfen; Fehler bei Auswahl löschen und Picker während des Speicherns deaktivieren.
- [x] Drei neue Testsuiten plus vorhandene Session-API- und Service-Tests ausführen:

```sh
npx vitest run tests/unit/lib/session-game-options.test.ts tests/unit/components/session-game-picker.test.tsx tests/unit/components/session-form-client.test.tsx tests/unit/api/sessions-crud.test.ts tests/unit/lib/services/session.test.ts
```

### 4. Impeccable-, Sicherheits- und Browserabnahme

- [x] `.agents/skills/impeccable/reference/craft-floor.md` und Club-Programme-Kontext vor der UI-Änderung gelesen.
- [x] Detector für Picker, Formular und Popover-Hülle ausgeführt: 0 Regex-Findings. CLI weist darauf hin, dass ohne gerenderte Seite Layout- und Kontrastregeln nicht mitgeprüft wurden.
- [ ] Lesende Browserprüfung bei 390 und 1440 px, Hell/Dunkel und 200 % Zoom: Browserhost nicht verfügbar; Abnahme bleibt offen.
- [x] Tastaturbedienung automatisiert mit Escape, Tab, Auswahl und Enter geprüft; [ ] manuelle VoiceOver-Prüfung offen.
- [x] Server-Besitz- und Soft-Delete-Prüfung mit vorhandenen Service-Tests bestätigt. Keine API und keine externen Suchanfragen.
- [ ] Schreibende Browser-E2E nur mit ausdrücklich isolierter Testdatenbank und entsprechender Freigabe; bis dahin Submit im Komponenten-Test mocken.

### 5. Dokumentation und Abschluss

- [ ] `docs/FEATURES.md`, `src/lib/faq.ts`, `CONCEPT.md`, Backlog, Changelog und die drei aktuellen Review-Dokumente mit tatsächlichem Verhalten aktualisieren. OpenAPI ist unverändert, da sich der API-Vertrag nicht änderte.
- [ ] `npm run typecheck`, gezieltes ESLint, betroffene Unit-Tests, `npm run security-check` und `npm run review-evaluate:regression` ausführen. Coverage nach FEAT-018 ist bereits durch neue Picker-/Formtests erweitert.
- [ ] Commit einschließlich Hook-Prüfungen erstellen. Browser-/VoiceOver-Nachweise und offene Abnahmen im Plan ausweisen; ohne Nachweis keine vollständige UI-Abnahme behaupten.

## Freigabekriterien

Die Web-Umsetzung wurde am 02.11.2026 freigegeben. iOS und Suche im
Mitspielerfeld benötigen eigene Planung. Commit-/Review-Nachweis wird nach den
Repository-Hooks ergänzt; gerenderte Browser- und manuelle VoiceOver-Abnahme
bleiben offen.

**Selbstprüfung 02.11.2026:** Anforderungsabgleich mit dem Backlog durchgeführt; Auswahl-ID, Suchtext, Formularvalidierung und serverseitiger Besitznachweis sind getrennt beschrieben. Tastatur-, IME-, Leer-/Fehlerzustände und große Listen haben konkrete Testschritte. Die Planaktualisierung vor der Umsetzung bestätigt FEAT-017/018 als nicht betroffen und dokumentiert den fehlenden Radix-Wrapper.

## Ergebnis der Umsetzung 02.11.2026

- Lokaler Filter normalisiert Groß-/Kleinschreibung, Umlaute, `ß`/`ss` und
  HTML-Entities; Ergebnisreihenfolge und doppelte Namen bleiben erhalten.
- Radix-Popover-Picker zeigt eine beschriftete Suche, Trefferstatus, Listbox,
  aktive Option, verständliche Leerzustände und Link zur Sammlungserstellung.
- Auswahl bindet ausschließlich die ID. Die Formularintegration prüft die ID
  erneut gegen die aktuelle Optionsliste, setzt bei fehlendem/veraltetem Wert
  einen Feldfehler und fokussiert den Auslöser. API und serverseitige
  Besitzprüfung blieben unverändert.
- TDD: Filter (4), Picker (12) und Formular (3) Tests bestanden; RED-Läufe
  belegten zunächst fehlenden Filter, Picker und fehlende Formularvalidierung.
- Ausstehend: manuelle Browser-/VoiceOver-Prüfung bei 390/1440 px, Hell/Dunkel
  und 200-%-Zoom, falls der Browserhost nicht verfügbar ist.
- Commit `7fba032` erstellt. Pre-Commit-ESLint, related Vitest, Security-Check
  (0 Fehler; 2 bestehende Hinweise) und Regressionsevaluator (10/10, keine
  Regression) bestanden. Review-Snapshot:
  `docs/code-reviews/history/2026-11-02_1115.json`.
