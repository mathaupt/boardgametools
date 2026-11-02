# FEAT-016 – Durchsuchbare Spielauswahl bei der Session-Anlage

> **Für ausführende Agenten:** Aufgaben einzeln bearbeiten; bei Laufzeitänderungen RED → GREEN → REFACTOR belegen. Dieser Plan ist zur Prüfung erstellt und erteilt keine Umsetzungsfreigabe.

**Ziel:** Ein Spiel aus der eigenen Sammlung im Webformular `/dashboard/sessions/new` durch Eingabe eines Namens finden und verbindlich auswählen.

**Architektur:** Ein fokussierter Client-Picker ersetzt ausschließlich die Spielauswahl. Der Server liefert weiterhin die alphabetisch sortierte eigene Sammlung. Ein reiner Filter verarbeitet bereits geladene Namen; der Picker übergibt ausschließlich eine gewählte Spiel-ID an das Formular.

**Stack:** Next.js App Router, TypeScript, React, vorhandenes `radix-ui`-Popover, bestehende Button-/Input-Primitiven, Vitest/Testing Library, jest-axe.

## Ausgangsstand und Aktualitätsprüfung

Am 02.11.2026 gegen Commit `80d770d` und die aktuellen Quellen geprüft:

- `src/app/(dashboard)/dashboard/sessions/new/page.tsx` liest eigene, nicht gelöschte Spiele; die Abfrage sortiert nach Namen und liefert ID, Namen, Bild-URL und Spielerbereich.
- `session-form-client.tsx` verwendet ein Radix-Select ohne sichtbare Texteingabe. Mitspieler verwenden separate Selects.
- `src/lib/services/session.service.ts` prüft beim Erstellen Besitz und Löschstatus des Spiels. Diese serverseitige Prüfung bleibt maßgeblich.
- `radix-ui` ist vorhanden; `cmdk`, ein Command-Primitiv und ein eigener Combobox-Baustein sind nicht vorhanden. Eine neue Paketabhängigkeit ist nicht erforderlich.
- iOS verwendet in `BoardGameTools/BoardGameTools/Views/SessionEditView.swift` einen nativen Picker ohne `.searchable`. Eine iOS-Suchauswahl ist ein eigener späterer Plan.

Vor der Umsetzung denselben Abgleich wiederholen, insbesondere nach FEAT-017/018: Picker-Bausteine, Formulartests, aktuelle Coverage und Planstatus prüfen; Ergebnis mit Commit/Datum hier ergänzen.

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
| `src/components/sessions/session-game-options.ts` | Typ `SessionGameOption`, Normalisierung und unverändernder Filter. |
| `src/components/sessions/session-game-picker.tsx` | Popover, lokaler Filterzustand, Listbox und Tastatur-/Fokussteuerung; unter 300 Zeilen. |
| `src/app/(dashboard)/dashboard/sessions/new/session-form-client.tsx` | Picker anbinden; gültige ID vor `fetch` prüfen, Feldfehler zeigen und Fokus zum Picker setzen. |
| `tests/unit/components/session-game-picker.test.tsx` | Nutzerverhalten des Pickers. |
| `tests/unit/lib/session-game-options.test.ts` | Filter- und Normalisierungsvertrag. |
| `tests/unit/components/session-form-client.test.tsx` | ID-Bindung, Submit und Fehlerrückmeldung. |

Der Picker erhält `games`, `value`, `onValueChange`, `id`, `disabled` und optionale Fehlerbeschreibung. `onValueChange` wird ausschließlich nach einer gültigen Optionsauswahl aufgerufen. Der Query-Text ist kein Formularwert. Bestehende Serverabfrage, Mitspielerfelder und API-Verträge bleiben beim aktuellen Umfang.

## Schrittweise Umsetzung

### 1. Reinen Filter testgetrieben erstellen

- [ ] In `tests/unit/lib/session-game-options.test.ts` einen Verhaltenstest schreiben:

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

- [ ] Nach Anlage des Tests bei Bedarf einen typisierten Export ohne Filterverhalten bereitstellen, damit der Test ausführbar ist. `npx vitest run tests/unit/lib/session-game-options.test.ts` ausführen: die Erwartung auf „Mühle“ muss fachlich fehlschlagen. Import-/Syntaxfehler sind kein solcher RED-Nachweis.
- [ ] Den Typ und Filter in `session-game-options.ts` ergänzen. Normalisierung: `gameTextForRead`, Unicode-NFD, kombinierende Zeichen entfernen, deutsche Kleinschreibung, `ß` → `ss`, Rand-Leerraum entfernen. Leere Query liefert die unveränderte Reihenfolge, kein In-place-Sortieren.
- [ ] Tests für Teilsuche, Entities, Leerzeichen, „Straße“, keine Treffer und doppelte Namen ergänzen; anschließend denselben Testbefehl grün ausführen.

### 2. Picker mit Tastatur- und Statusvertrag erstellen

- [ ] Zuerst Interaktionstests in `tests/unit/components/session-game-picker.test.tsx` schreiben: Öffnen, Suchfeldfokus, Filterung, Auswahl per Klick und Pfeil/Enter, genau eine ID-Rückgabe, Escape, Tab, Query-Reset, Leeren ohne Auswahlverlust, IME und kein Submit bei Enter ohne Treffer.
- [ ] `npx vitest run tests/unit/components/session-game-picker.test.tsx` ausführen und fehlendes Verhalten als RED belegen.
- [ ] Den Picker mit `Popover` aus `radix-ui` und vorhandenen `Button`/`Input` entwickeln. Keine Eingabe in das bestehende Radix-Select verschachteln; seine Typeahead- und Fokussteuerung würde mit dem Suchfeld konkurrieren.
- [ ] Feld-/Statusbeziehungen und `jest-axe` prüfen. Leere Liste und 1.000 lokale Testoptionen abdecken; keine stille Begrenzung auf die ersten Treffer einbauen.
- [ ] Test grün ausführen, dann Aufteilung und Zustandsnamen refaktorieren.

### 3. Formularintegration absichern

- [ ] In `tests/unit/components/session-form-client.test.tsx` zuerst belegen, dass ein bloß eingegebener Spielname nicht als `gameId` gesendet wird. Fehlende/ungültige ID verhindert `fetch` und erzeugt einen fokussierbaren Feldfehler.
- [ ] Erfolgreiche Auswahl testen: Suchtext „az“, gewählte ID „game-azul“; der POST-Body enthält `gameId: "game-azul"`, keinen Suchtext. Mitspieler, Datum, Dauer und Notizen bleiben im bestehenden Payload.
- [ ] `npx vitest run tests/unit/components/session-form-client.test.tsx` für RED ausführen. Dann die Spielauswahl ersetzen und die Zugehörigkeit zur Optionsliste vor dem Speichern prüfen. Ein `required` an `type="hidden"` ersetzt diese Prüfung nicht.
- [ ] Fehler bei erneuter gültiger Auswahl zurücknehmen; während des Speicherns die Auswahl deaktivieren. Fehlgeschlagener POST erhält die Auswahl.
- [ ] Die drei neuen Testsuiten sowie bestehende Session-API- und Service-Tests grün ausführen:

```sh
npx vitest run tests/unit/lib/session-game-options.test.ts tests/unit/components/session-game-picker.test.tsx tests/unit/components/session-form-client.test.tsx tests/unit/api/sessions-crud.test.ts tests/unit/lib/services/session.test.ts
```

### 4. Impeccable-, Sicherheits- und Browserabnahme

- [ ] Vor UI-Änderungen `.agents/skills/impeccable/reference/craft-floor.md` lesen; Kontext und Oberflächenbrief für die konkrete Datei berücksichtigen. Die bestehende Club-Programme-Gestaltung verfeinern.
- [ ] Detektor auf `src/components/sessions/session-game-picker.tsx` und das Sessionformular anwenden; Findings beheben oder begründet einordnen.
- [ ] Lesende Browserprüfung bei 390 und 1440 px, hell/dunkel und 200 % Zoom: lange Namen umbrechen, Touch-Ziele mindestens 44 px, Popover bleibt bei Bildschirmtastatur bedienbar; keine horizontale Überbreite. Browserzugriff war zuletzt nicht verfügbar und ist vor Abnahme erneut zu prüfen.
- [ ] Tastatur und VoiceOver manuell prüfen; automatische ARIA-Prüfung ersetzt diesen Nachweis nicht.
- [ ] Server-Besitzprüfung und Löschstatus anhand bestehender Service-Tests bestätigen. Keine neue API und keine Suchanfragen an fremde Dienste.
- [ ] Schreibende Browser-E2E nur mit ausdrücklich isolierter Testdatenbank und entsprechender Freigabe; bis dahin Submit im Komponenten-Test mocken.

### 5. Dokumentation und Abschluss

- [ ] `docs/FEATURES.md`, `src/lib/faq.ts`, `CONCEPT.md`, Backlog, Changelog und die drei aktuellen Review-Dokumente mit tatsächlichem Verhalten aktualisieren. OpenAPI nur ändern, falls sich entgegen diesem Plan ein API-Vertrag ändert.
- [ ] `npm run typecheck`, gezieltes ESLint, betroffene Unit-Tests, `npm run security-check` und `npm run review-evaluate:regression` ausführen. Nach Einbindung der neuen Tests Coverage für FEAT-018 aktualisieren.
- [ ] Commit einschließlich Hook-Prüfungen erstellen. Browser-/VoiceOver-Nachweise und offene Abnahmen im Plan ausweisen; ohne Nachweis keine vollständige UI-Abnahme behaupten.

## Freigabekriterien

Alle bestehenden Abnahmekriterien von FEAT-016 sind durch die Schritte abgedeckt. Eine Freigabe bestätigt Web zuerst, den Suchpicker und dessen Zustandsvertrag. iOS und Suche im Mitspielerfeld benötigen eigene Planung. Vor Umsetzung Datum, freigegebenen Umfang und aktuellen Commit ergänzen.

**Selbstprüfung 02.11.2026:** Anforderungsabgleich mit dem Backlog durchgeführt; Auswahl-ID, Suchtext, Formularvalidierung und serverseitiger Besitznachweis sind getrennt beschrieben. Tastatur-, IME-, Leer-/Fehlerzustände und große Listen haben konkrete Testschritte. Die Planung führt keine Runtimeänderung aus.
