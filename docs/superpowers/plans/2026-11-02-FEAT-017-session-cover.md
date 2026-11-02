# FEAT-017 – Spielcover in der Sessions-Übersicht

> **Für ausführende Agenten:** Aufgaben einzeln abarbeiten; jede Änderung am Laufzeitverhalten erhält zuerst einen gezielten fehlgeschlagenen Test. Umsetzung am 02.11.2026 freigegeben und begonnen.

**Ziel:** In `/dashboard/sessions` das gespielte Spiel anhand eines kleinen Covers erkennen, während Name, Datum und Ergebnisse gut lesbar bleiben.

**Architektur:** Die Server-Seite behält Datenabfrage und Berechtigungen. Eine fokussierte Client-Komponente rendert ausschließlich das Cover und dessen Ladefehler-Fallback. Der Rest der Sessionliste bleibt serverseitig.

**Stack:** Next.js `Image`, React, TypeScript, bestehende Lucide-/Club-Programme-Tokens, Vitest, Testing Library und jest-axe.

## Ausgangsstand und Aktualität

Am 02.11.2026 gegen `80d770d`, `src/app/(dashboard)/dashboard/sessions/page.tsx`, `next.config.ts` und `src/lib/storage.ts` geprüft:

- Die Serverliste lädt höchstens 20 eigene, nicht gelöschte Sessions, neueste zuerst. Jede Karte zeigt aktuell dasselbe Würfelzeichen statt eines Covers.
- `include.game: true` lädt das Bild bereits mit. Die Session-Detailansicht zeigt ein vorhandenes Bild; ihr Layout ist kein Bestandteil dieses Features.
- Next Image und CSP erlauben aktuell `https://cf.geekdo-images.com`; lokale Uploads verwenden `/uploads/`. Vercel-Blob-URLs werden vom Storage erzeugt, ihr Host ist aber nicht in der aktuellen Bild-/CSP-Konfiguration freigegeben.
- Der iOS-`SessionListView.swift` verwendet `Image("SessionIcon")`, kein dynamisches Spielcover. Native Anpassungen separat planen und im Simulator abnehmen.
- Unabhängige Impeccable-Kritik: 21/40; Detektor 0 statische Findings. Der Browserhost war nicht verfügbar. Der Score bewertet die bestehende Gesamtansicht, keine gerenderte Covervariante.

Vor Umsetzung aktuelle Query, Bild-Policy, Cache-Datentypen und FEAT-016/018-Tests erneut prüfen; Commit, Abweichungen und Ergebnis hier festhalten.

### Aktualitätsprüfung vor Implementierung (02.11.2026)

Geprüft auf HEAD `4c9e70d` nach den Planänderungen für FEAT-016/018. FEAT-016
ist weiterhin Planung; FEAT-018 hat keine Laufzeitänderungen. Die Sessions-Seite
verwendet weiterhin `include: { game: true }`, begrenzt auf 20 eigene, nicht
gelöschte Sessions und hängt Cache-Schlüssel/-Tag an `userId`. Anders als im
Plan gefordert fehlt auf dieser Seite noch die explizite Auth-Prüfung vor dem
Cache-/Datenbankzugriff. Die Session-Anlage verwendet bereits `redirect("/login")`;
das wird für die Liste übernommen. Die Spielabfrage wird auf `id`, `name` und
`imageUrl` beschränkt. Detail-/Edit-Aktionen und Ergebnisdaten bleiben erhalten.

`next.config.ts` erlaubt Next Image nur für HTTPS von
`cf.geekdo-images.com` und `/uploads/` ist die lokale Storage-URL. Der produktive
Blob-Provider liefert URLs mit dynamischem Host, der aktuell nicht in
`remotePatterns`/CSP steht. Um keine breite Freigabe einzuführen, bleiben solche
URLs bei einem dekorativen Fallback, bis eine eigene Host-Policy geplant ist.
Die empfohlene 56-px-Miniatur neben Titel und Datum wird umgesetzt; mobile
Darstellung darf auf 48 px schrumpfen. Der vorhandene Würfelplatzhalter wird
durch ein neutrales Lucide-Symbol ersetzt. Es gibt noch keine Tests für die
Sessions-Listenseite oder Coverquellen; diese werden vor Produktionscode
hinzugefügt. Der Plan bleibt aktuell, Auth-Guard und sichere Prisma-Auswahl
werden als explizite Umsetzungspunkte ergänzt.

## Gestaltungsannahme für die Planfreigabe

Kleine, links stehende Cover neben Titel und Datum wurden als Planungsempfehlung angekündigt und mit dem Start der Implementierung am 02.11.2026 übernommen.

| Variante | Bewertung |
|---|---|
| Kleines Cover neben Titel/Datum | Empfohlen: Wiedererkennung ohne große Kartenhöhen; ungefähr 56 × 56 px, bei schmalem Raum 48 × 48 px. |
| Großer Datumsblock plus Mini-Cover | Stärkt den zeitlichen Charakter, verändert aber die Hierarchie stärker als die Bildanforderung. |
| Große Coverkarten | Zeigen das Artwork besser, verringern jedoch die Zahl sichtbarer Sessions; für diese Arbeitsansicht nicht empfohlen. |

Das Cover zeigt das vollständige Motiv mit `object-contain` auf semantischer neutraler Fläche. Name und Datum bleiben Text. Das Cover ist dekorativ (`alt=""`, umgebender Bereich `aria-hidden`), weil der Name direkt daneben steht. Der Fallback verwendet ein gleich großes Lucide-Würfelsymbol, keinen Text- oder Farbcode als einzige Information.

Such-/Filterfunktionen, die 20er-Begrenzung, Aktionshierarchie, Spielergebnisverdichtung und Detailansicht bleiben separate Anforderungen aus der Kritik. Eine Coverergänzung wird nicht als Lösung dieser Punkte ausgegeben.

## Bildquellen und Fehlervertrag

| Quelle/Zustand | Verhalten |
|---|---|
| `https://cf.geekdo-images.com/...` ohne fremde Credentials/Port | Mit Next Image, expliziter Größe und `sizes`, ohne Preload rendern. |
| Lokaler Pfad `/uploads/...` | Mit Next Image rendern; `//...`, Daten- und Script-URLs ablehnen. |
| Kein Bild, leere oder syntaktisch ungültige URL | Direkt Fallback. |
| Unbekannter Host, einschließlich aktuell nicht freigegebenem Blob-Host | Fallback, keine unkontrollierte Optimizer-Anfrage. |
| Lade-/Decodierfehler | `onError` schaltet auf Fallback; keine Endlosschleife von Retries. |
| Geänderte Bild-URL | Fehlerzustand gehört zur URL und blockiert eine neue gültige URL nicht. |

Kein pauschales `remotePatterns: **`, kein `unoptimized` als Policy-Umgehung und keine breite CSP-Freigabe. Falls bei der Umsetzungsprüfung echte unterstützte Coverquellen eine zusätzliche Domain benötigen, den exakten Host mit CSP/Image-Policy gesondert begründen und freigeben. Ohne diese Erweiterung ist der Fallback für solche Quellen ausdrücklich dokumentiert.

## Dateiverantwortungen

| Datei | Änderung |
|---|---|
| `src/components/sessions/session-cover.tsx` | Kleiner Client-Baustein für Bild, URL-bezogenen Fehlerzustand und dekorativen Fallback. |
| `src/components/sessions/session-cover-source.ts` | Reine Prüfung/Normalisierung der für diese Ansicht unterstützten Quellen. |
| `src/app/(dashboard)/dashboard/sessions/page.tsx` | Cover integrieren; Spielfelder auf `id`, `name`, `imageUrl` begrenzen; Auth vor Query sicherstellen. |
| `tests/unit/components/session-cover.test.tsx` | Bild/Fallback, Fehler und erneute URL. |
| `tests/unit/lib/session-cover-source.test.ts` | Unterstützte und abgelehnte Quellen. |
| `tests/unit/components/sessions-page.test.tsx` | Server-Seite mit gemockter Infrastruktur und echten gerenderten Sessionkarten. |

Der Cover-Baustein erhält `imageUrl: string | null`. Keine Session-/Nutzerdaten in den Client serialisieren. Auswahl und Datenabfrage verbleiben in der Server-Seite. Neue Dateien bleiben unter 300 Zeilen.

## Schrittweise Umsetzung

### 1. Bildquellen testgetrieben begrenzen

- [x] Zuerst `tests/unit/lib/session-cover-source.test.ts` mit erlaubten Upload-/BGG-Pfaden und abgelehnten Fremdhosts, Protokoll-relativen URLs, `javascript:`, `data:`, leeren Werten und ungültigen URLs schreiben.

```ts
import { expect, it } from "vitest";
import { getSessionCoverSource } from "@/components/sessions/session-cover-source";

it("akzeptiert die bestehenden Quellen und verwirft fremde Hosts", () => {
  expect(getSessionCoverSource("/uploads/azul.jpg")).toBe("/uploads/azul.jpg");
  expect(getSessionCoverSource("https://cf.geekdo-images.com/a.jpg"))
    .toBe("https://cf.geekdo-images.com/a.jpg");
  expect(getSessionCoverSource("https://example.org/a.jpg")).toBeNull();
  expect(getSessionCoverSource("//example.org/a.jpg")).toBeNull();
  expect(getSessionCoverSource(null)).toBeNull();
});
```

- [x] Nach Anlage des Tests den reinen Prüfer zunächst mit leerer Rückgabe bereitstellen und fachliche Fehlfälle beobachten; Syntax-/Importfehler waren nicht der Nachweis.
- [x] Den reinen Prüfer implementieren. Remote-URL über `URL` parsen, Protokoll/Host/Port/Credentials prüfen; lokale Pfade auf `/uploads/` begrenzen. Alle 13 Quellprüfungen bestanden.

### 2. Cover und Fallback absichern

- [x] In `tests/unit/components/session-cover.test.tsx` zuerst Bild, feste Maße, dekorativen Fallback, Ladefehler und neue URL belegen.
- [x] `next/image` im Test durch eine Testdarstellung ersetzen. `fireEvent.error` prüft den Fehlerpfad; CDN-Erreichbarkeit wird nicht getestet.
- [x] `npx vitest run tests/unit/components/session-cover.test.tsx` für RED ausführen. Anschließend den Client-Baustein implementieren: `failedSource` statt globalem dauerhaften Fehlerflag, `onError`, `alt=""`, `sizes="56px"`, feste Bildfläche und `object-contain`.
- [x] Tests grün; `jest-axe` ohne Findings. Das dekorative Cover bleibt für Screenreader verborgen.

### 3. Serverliste integrieren und abgrenzen

- [x] `tests/unit/components/sessions-page.test.tsx` mit gemockter `auth`, `cachedQuery` und Prisma ergänzt. Die echte async Seite wird aufgerufen und das React-Element gerendert.
- [x] Fixtures prüfen Cover/Fallback, mehrere Sessions desselben Spiels, leere Liste und fehlende Anmeldung. Bestehende Details-/Bearbeiten-Links bleiben nachweisbar.
- [x] RED für Coverdarstellung und fehlenden Login-Guard belegt.
- [x] `SessionCover` integriert, Würfelplatzhalter ersetzt und Header mit `min-width: 0`, Umbruch und festen Bildmaßen angepasst. Login-Guard vor Cache-/DB-Abfrage ergänzt. Eigentums-/Löschfilter und Cache-Tag beibehalten; `game` auf ID, Name und Bild-URL beschränkt.
- [x] Alle drei Testsuiten grün ausgeführt:

```sh
npx vitest run tests/unit/lib/session-cover-source.test.ts tests/unit/components/session-cover.test.tsx tests/unit/components/sessions-page.test.tsx
```

### 4. Impeccable und Bildperformance abnehmen

- [x] Vor UI-Änderungen `craft-floor.md`, Club Programme, lokale Next-Image-Dokumentation und React/Next-Server-Client-Vorgaben gelesen. Bestehende Farbrollen, Schrift und ruhige Gestaltung beibehalten.
- [x] Statische Impeccable-Prüfung für Listenseite und Cover ausgeführt: 0 Regex-Findings. Die CLI meldet, dass Layout-/Kontrastregeln ohne gerenderte Seite nicht geprüft wurden.
- [ ] 20 Sessions mit wiederholten, fehlenden und fehlerhaften Bildern prüfen: keine Layoutsprünge beim Laden, keine horizontale Überbreite, lesbare Metadaten, ausreichend große unveränderte Aktionsziele.
- [ ] Im Browser Bildressourcen prüfen: passend kleine `srcset`-Varianten, lazy loading und kein Preload aller Covers. Mocks können diese Prüfung nicht ersetzen.
- [x] Automatisiert geprüft: Cover und Fallback sind dekorativ verborgen; `jest-axe` findet keine Probleme. Manuelle VoiceOver-Abnahme bleibt offen.
- [x] Browserhost erneut geprüft; er ist nicht verfügbar. Gerenderte Browserabnahme ist im Backlog als offen markiert.

### 5. Dokumentation und Abschluss

- [x] `docs/FEATURES.md`, FAQ, Feature-Backlog, Bugliste und Changelog aktualisiert. `CONCEPT.md` entfällt: bestehender Sessionbereich ohne neue Domäne. Kein API-/Schemawechsel.
- [x] Review-Dokumente aktualisiert; den betroffenen Coverage-Nachweis für FEAT-018 mit dem nächsten Coveragepaket erneuern.
- [x] Betroffene Unit-Tests (20/20), `npm run typecheck`, gezieltes ESLint, `npm run security-check`, Produktionsaudit und `npm run review-evaluate:regression` ausgeführt.
- [ ] Commit mit Hook-Ergebnissen erstellen. Responsive Browserabnahme und unbekannte Blob-Hosts als Grenzen im Backlog sichtbar halten.

## Freigabekriterien

Die Freigabe bestätigt Web-Sessions-Liste, kleine Cover und den dokumentierten Quellen-/Fallbackvertrag. Sie schließt weder iOS noch die übrigen Kritikpunkte ein. Größenangaben sind Startwerte für den gerenderten Vergleich; die Lesbarkeit entscheidet über die endgültige Ausführung.

**Selbstprüfung 02.11.2026:** Quellenprüfung, Bild-/Fehlerkomponente, Serverintegration und gerenderte Prüfung abgebildet. Clientgrenze bleibt auf dem Bildbaustein; gesicherte Query und geringe Bildgröße sind umgesetzt. Die kleine Covervariante wurde bei Implementierungsstart übernommen.

## Umsetzungsstand (02.11.2026)

Umsetzung für das Web gestartet und umgesetzt. Gezielte Unit-Tests 20/20
bestanden (inklusive `jest-axe`), `npm run typecheck`, gezieltes ESLint und
`npm run build` bestanden. Der Commit-Hook-Securitycheck hatte 0 Fehler und
2 bestehende Warnungen zu Raw-SQL und Debug-Routen; `npm audit` meldete
0 Vulnerabilities. Der Regressionsevaluator endete mit 10/10, ohne offene
Findings und ohne Regressionen. Der Detektor meldete 0 Regex-Findings, konnte aber mangels
Browserhost keine gerenderte Layout-/Kontrastprüfung ausführen. Upload-URLs
unbekannter Blob-Hosts fallen auf das Würfelsymbol zurück; eine exakte
Hostfreigabe ist nicht Teil dieser Umsetzung.
