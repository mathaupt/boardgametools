# FEAT-009 – HTML-Entities in Spieldaten korrekt behandeln

**Status:** Code umgesetzt und Unit-Suite, Typprüfung, Build, iOS-Vertrag, Fast-Security-Check und Impeccable-Detektor abgeschlossen. E2E und vollständiger Security-Check sind nicht abgenommen. Produktionsbereinigung bleibt separat freigabepflichtig.

## Aktualitätsprüfung vor Umsetzung – 2026-10-31

- **Geprüfter Stand:** Commit `9def76f` (`added new implementation plans`); Arbeitsbaum war sauber.
- **Ergebnis:** Planarchitektur und vereinbarter Umfang sind weiterhin passend. Ergänzend werden die bisher nicht erfasste Inline-BGG-Suche `src/app/api/bgg/route.ts` (eigene XML-Parser) und ihre Tests in der gemeinsamen Normalisierung berücksichtigt.
- **Cache-Strategie angepasst:** Next `unstable_cache`-Einträge für Spiele, Dashboard, Sessions und Events laufen nach 60 Sekunden ab. Das externe Wartungs-CLI kann `revalidateTag` nicht zuverlässig aus einem Next Request-Kontext aufrufen. Nach einem CLI-Lauf werden betroffene Einträge daher spätestens nach 60 Sekunden erneuert; die Doku weist diese Obergrenze aus und eine produktive Sofortinvalidierung wird nicht behauptet.
- **Abgrenzung:** Produktionsdaten werden nicht gelesen oder verändert. Implementierung, isolierte Tests und Dry-Run-/Rollback-Code sind umfasst; tatsächliche Produktionsbereinigung bleibt ein separater Freigabeschritt nach geprüftem Manifest und Backup.
- **Keine weiteren Planänderungen nötig:** Schema, DTO-Vertrag, 8-Ebenen-Grenze, vorhandene Berechtigungen und iOS-Vertrag bleiben unverändert.

**Ziel:** Spielnamen und Beschreibungen erscheinen in Web, Suche, Mobile-API und iOS mit den beabsichtigten Sonderzeichen; bestehende kodierte Daten werden kontrolliert bereinigt.

**Architektur:** Ein gemeinsamer, idempotenter Normalisierer verarbeitet Text an Import- und Schreibgrenzen. Lesemapper verwenden denselben Normalisierer als Übergangsschutz für Bestandsdaten. Eine gesonderte Wartungsfunktion korrigiert Game.name, Game.description und GameProposal.bggName anhand eines prüfbaren Manifests.

**Technik:** TypeScript, Next.js 16, Prisma 7, PostgreSQL, Vitest, CodeceptJS und bestehende Swift-Vertragstests. Die bereits lokal als Entwicklungsabhängigkeit vorhandene Bibliothek entities 8.0.0 wird direkt als Produktionsabhängigkeit aufgenommen; keine Abhängigkeit auf ihren transitiven Installationsort.

**Abarbeitung:** Nach ausdrücklicher Freigabe schrittweise mit test-driven-development. Jeder Abschnitt beginnt mit dem benannten fehlschlagenden Verhaltenstest und endet mit Prüfung und Commit. Keine automatische Delegation.

## 1. Bestand und Ursache

- src/lib/bgg-xml.ts dekodiert eine kleine, feste Liste. Allgemeine dezimale und hexadezimale Unicode-Referenzen sowie viele benannte Entities fehlen.
- Eine Ersetzung von `&amp;` entfernt bei `&amp;amp;` nur eine Ebene; weitere Aufrufe können denselben Wert erneut verändern.
- src/lib/bgg.ts dekodiert importierte Namen und Beschreibungen; einzelne Metadaten werden über parseAllXMLAttributeValues und danach noch einmal verarbeitet.
- scripts/fix-html-entities.ts besitzt einen abweichenden Decoder, lädt implizit eine Datenbank aus der Umgebung, schreibt sofort, liest alle Spiele auf einmal und verwendet String.fromCharCode auch für Unicode außerhalb der BMP.
- GameService.create/update übernehmen manuelle Texte unverändert. Der Web-BGG-Import schreibt direkt über Prisma; der Mobile-Import verwendet GameService. Öffentliche BGG-Vorschläge speichern bggName separat.
- Mobile-DTOs und direkte Serverabfragen liefern gespeicherte Texte unverändert. Eine Korrektur nur in einer React-Komponente erreicht weder Suche noch iOS.

Die genaue Herkunft eines einzelnen Produktionswerts lässt sich daraus nicht beweisen. Die Fehlermuster sind aus Quellcode und vorhandenen Testfällen ableitbar; vor einer Datenbereinigung ist ausschließlich ein lesender Bestandsbericht vorgesehen.

## 2. Festgelegte Planregeln

1. „Genau einmal“ bezeichnet einen fachlichen Normalisierungsschritt bis zum stabilen Klartext, nicht genau einen String-Ersetzungsdurchlauf. Erneute Normalisierung ändert das Ergebnis nicht.
2. Nur vollständig geschriebene, von HTML erkannte Entities mit Semikolon dekodieren. AT&T, echte &, < und > sowie unbekannte `&spiel;` bleiben unverändert.
3. Bekannte Entity-Schreibweisen in manuellen Namen/Beschreibungen gelten entsprechend der Backlog-Anforderung als kodierter Text. Die absichtliche Darstellung der Zeichenfolge `&amp;` selbst ist dadurch nicht unterscheidbar; dies ist Teil der zu bestätigenden Produktregel.
4. Höchstens acht verschachtelte Kodierungsebenen zulassen. Tiefer kodierte Eingaben zurückweisen, statt teilweise normalisierten Text zu speichern. Bestandswerte mit diesem Muster im Bericht aussondern.
5. Der Textnormalisierer entfernt keine HTML-Tags, Links oder sonstigen Zeichen. BGG-Beschreibungen besitzen einen separaten Formatierungsschritt für tatsächlich importiertes Markup; mathematische Zeichenfolgen wie „1 < 3 > 2“ bleiben erhalten.
6. Ausgabe ausschließlich als Text: React-Ausdrücke, JSON-Strings und native String-Darstellung. Kein dangerouslySetInnerHTML, HTML-WebView oder DOM-Einfügen.
7. Keine pauschale Dekodierung von Tokens, URLs, IDs, Spitznamen, Passwörtern oder beliebigen JSON-Feldern.
8. Kein Schemawechsel; Game.updatedAt und bei geänderten Inline-Vorschlägen Event.updatedAt aktualisieren. Erstellungszeiten, IDs, Besitz und Relationen bleiben erhalten.

## 3. Dateien und Verantwortlichkeiten

| Datei | Änderung |
|---|---|
| src/lib/game-text.ts | Neue reine Klartextnormalisierung und abgesicherter Lesefallback |
| src/lib/bgg-xml.ts, src/lib/bgg.ts | Decoder vereinheitlichen; BGG-Beschreibung separat formatieren |
| src/lib/services/game.service.ts | Manuelle create/update-Texte normalisieren, dann fachlich validieren |
| src/app/api/games/import-bgg/route.ts | Normalisierte BGG-Daten speichern; vorhandene Duplikat-/Eigentümerregeln beibehalten |
| src/app/api/mobile/v1/bgg/import/route.ts | Gemeinsame Normalisierung über BGG-/GameService-Pfad |
| src/app/api/barcode/lookup/route.ts, src/app/api/mobile/v1/bgg/lookup/route.ts | Produkttext vor BGG-Suche normalisieren |
| src/app/api/public/event/[token]/propose-bgg/route.ts | Normalisiertes bggName speichern |
| src/lib/dto-mappers/game.ts, src/lib/dto-mappers/event.ts | Text in GameDTO und Inline-BGG-Vorschlägen normalisieren |
| src/lib/public-event.ts, src/lib/services/event-proposal.service.ts | Öffentliche und private Spieltexte normalisieren, bestehende Feldfreigaben erhalten |
| src/app/(dashboard)/dashboard/games/games-list-client.tsx | Anzeigen und Suchvergleich auf denselben Klartext beziehen |
| src/app/(dashboard)/dashboard/page.tsx, src/components/dashboard/events-overview.tsx | Direkt geladene Spiel-/Gewinnernamen vor der Anzeige normalisieren |
| src/app/(dashboard)/dashboard/games/collection-game-card.tsx, src/app/(dashboard)/dashboard/games/[id]/game-detail-client.tsx | Klartext in Karte, Detail und Bildbeschriftung verwenden |
| src/app/(dashboard)/dashboard/sessions/[id]/session-detail-client.tsx, src/app/(dashboard)/dashboard/sessions/new/session-form-client.tsx | Spielbezug und Spielauswahl konsistent anzeigen |
| src/app/(dashboard)/dashboard/series/[id]/series-entry-card.tsx, src/app/(dashboard)/dashboard/groups/[id]/game-option-picker.tsx | Eingebettete Spielnamen und übernommene Optionen normalisieren |
| scripts/lib/game-text-cleanup.ts | Neue seitenweise Analyse, Manifestprüfung und konfliktgeschützte Updates |
| scripts/fix-html-entities.ts | CLI mit Dry-Run als Standard, Apply-/Rollback-Modus und expliziter Datenbank |
| package.json, package-lock.json | entities als direkte Produktionsabhängigkeit |

Weitere direkte Abfragen in Dashboard, Spiel-/Sessiondetails, Events, Exporten und Barcode-Antworten mit dem Suchlauf aus Aufgabe 2 erfassen und am jeweiligen Text-Ausgabepunkt adaptieren. Keine neue globale Middleware, die jedes JSON-Feld verändert.

## 4. Aufgaben

### Aufgabe 1 – Normalisierungsvertrag testgetrieben implementieren

**Neu:** src/lib/game-text.ts und tests/unit/lib/game-text.test.ts.

- [ ] Vorlauf: npm run review-evaluate:report. Betroffene Findings: XSS, Input-Validierung, API-Verträge, Caching und Dependency-Sicherheit.
- [ ] Tests mit folgenden tatsächlichen Erwartungen schreiben:

```ts
import { expect, it } from "vitest";
import { normalizeGameText } from "@/lib/game-text";

it("normalisiert mehrfach kodierte Werte idempotent", () => {
  const input = "Horrified: Dungeons &amp;amp; Dragons";
  const expected = "Horrified: Dungeons & Dragons";
  expect(normalizeGameText(input)).toBe(expected);
  expect(normalizeGameText(normalizeGameText(input))).toBe(expected);
});

it("bewahrt Klartext und interpretiert keinen HTML-Inhalt", () => {
  expect(normalizeGameText("AT&T: 1 < 3 > 2")).toBe("AT&T: 1 < 3 > 2");
  expect(normalizeGameText("&lt;img src=x onerror=alert(1)&gt;"))
    .toBe("<img src=x onerror=alert(1)>");
  expect(normalizeGameText("&#x1F3B2; &copy; &#039;")).toBe("🎲 © '");
});
```

- [ ] Ergänzen: leerer Text, Umlaute, unbekannte Entity, fehlendes Semikolon, Zeilenumbrüche, acht Ebenen erlaubt, neun Ebenen abgewiesen, keine Veränderung des Inputs.
- [ ] npx vitest run tests/unit/lib/game-text.test.ts ausführen; fehlende Funktion als roten Ausgangspunkt nachweisen.
- [ ] npm install --save-exact entities@8.0.0; Lockfile und Lizenz BSD-2-Clause prüfen. Dies ist die lokal belegte Version, keine Behauptung über die dann neueste Version.
- [ ] Folgenden Kern implementieren; null wird an den Callern erhalten:

```ts
import { decodeHTMLStrict } from "entities";

export function normalizeGameText(input: string): string {
  let text = input;
  for (let level = 0; level < 8; level += 1) {
    const next = decodeHTMLStrict(text).replaceAll(String.fromCharCode(160), " ");
    if (next === text) return text;
    text = next;
  }
  if (decodeHTMLStrict(text) !== text) {
    throw new RangeError("Zu viele verschachtelte HTML-Kodierungen.");
  }
  return text;
}

export function gameTextForRead(input: string): string {
  try { return normalizeGameText(input); }
  catch (error) {
    if (error instanceof RangeError) return input;
    throw error;
  }
}
```

- [ ] Länge vor dem Decoder begrenzen: manuell Name maximal 2.000, Beschreibung maximal 16.000 Eingabezeichen; danach bestehende fachliche Grenzen 200/2.000 prüfen. BGG-Verarbeitung ebenfalls auf die bereits begrenzten Textfelder beschränken.
- [ ] Tests erneut ausführen; erwartetes Ergebnis grün. Commit: feat: normalize game text entities.

### Aufgabe 2 – Import-, Schreib-, Lese- und Suchpfade vereinheitlichen

**Tests:** tests/unit/lib/bgg-xml.test.ts, tests/unit/lib/bgg.test.ts, tests/unit/lib/services/game.test.ts, tests/unit/lib/public-event.test.ts, tests/unit/app/api/mobile/v1/bgg.test.ts, tests/unit/app/api/mobile/v1/games.test.ts. **Neu:** tests/unit/api/game-text-imports.test.ts und tests/unit/components/game-text-rendering.test.tsx.

- [ ] In allen benannten Tests denselben Namen „Horrified: Dungeons `&amp;amp;` Dragons“ und dieselbe Beschreibung mit numerischen Referenzen einsetzen. BGG-Suche, Sammlung, Details, EAN und manuellen create/update-Pfad einzeln nachweisen.
- [ ] Direkte Grenzen vollständig erfassen:

```bash
rg -n 'game\.name|game\.description|bggName|name:.*bgg|description:.*bgg' src
rg -n 'prisma\.game\.(create|update)|fetchBGGGame|parseBGG' src
```

- [ ] Den Parser-Export decodeHtmlEntities als kompatiblen Adapter zum neuen Normalisierer erhalten; keine zweite Decoderimplementierung behalten.
- [ ] BGG-Bild-/Thumbnail-URLs von diesem Textadapter lösen: dort nur die einmalige XML-Transportdekodierung über decodeXML aus entities verwenden und anschließend die bestehende URL-Prüfung anwenden. Queryzeichen, Prozentkodierung und URL-Schemata nicht mit dem rekursiven Spieltextnormalisierer verändern; getrennte URL-Regressionstests ergänzen.
- [ ] BGG-Formatierung getrennt testen: bekannte Absatz-/Zeilenumbruch-Tags werden zu Textabsätzen, übriges importiertes Markup wird entfernt; „1 < 3 > 2“ und manuelle sichtbare Tags bleiben Klartext.
- [ ] GameService.create/update mit normalisierten name/description arbeiten lassen. Nicht übergebene Update-Felder unangetastet lassen; Fehler als deutsche 400-Antwort statt 500 abbilden.
- [ ] Die Ausgabemapper verwenden gameTextForRead für die benannten Felder. Berechtigungsprüfungen und öffentliche Beschreibungssperre aus FEAT-001 nicht verändern.
- [ ] Bei Suche sowohl Dataset als auch Suchbegriff vor dem bestehenden case-insensitiven Vergleich normalisieren. Kein clientseitiges Nachladen aller Spiele zur Umgehung einer serverseitigen Suche.
- [ ] Renderingtest: dekodiertes img-/script-Muster ist sichtbarer Text, es entsteht kein img-/script-DOM-Knoten. Suche findet den bereinigten Namen mit & und mit eingegebenem `&amp;`.
- [ ] Genannte Tests, Typecheck und gezieltes ESLint ausführen. Commit: feat: apply canonical game text across imports and APIs.

### Aufgabe 3 – Bestehende Daten kontrolliert bereinigen

**Neu:** scripts/lib/game-text-cleanup.ts und tests/unit/scripts/game-text-cleanup.test.ts. **Ändern:** scripts/fix-html-entities.ts, docs/DEPLOYMENT.md, .gitignore.

- [ ] Tests für Dry-Run ohne Writes, unveränderten zweiten Lauf, Unicode, Inline-BGG-Namen, Soft-Delete-Datensätze, Konflikte und Rollback schreiben. Rein isolierte Prisma-Mocks; keine Umgebungsdatenbank im Unit-Test.
- [ ] Game-Datensätze einschließlich Soft-Deletes und GameProposal.bggName in stabilen ID-Seiten zu 200 lesen; niemals findMany ohne take für den Gesamtbestand.
- [ ] Nur BGT_MAINTENANCE_DATABASE_URL akzeptieren. Kein dotenv/config und kein stiller Fallback auf SQL_DATABASE_URL oder .env.prod.
- [ ] Manifest mit Version, Datenbankfingerprint, IDs, alten/neuen Feldwerten und Vergleichsfeldern schreiben. Keine Inhalte auf stdout; nur Mengen und Konfliktzahlen. Manifest als vertrauliche Datei mit Modus 0600 unter ignoriertem .maintenance/ ablegen.
- [ ] CLI-Vertrag:

```bash
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --dry-run --report .maintenance/feat009.json
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --apply --manifest .maintenance/feat009.json
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --rollback --manifest .maintenance/feat009.json
```

  BGT_TEST_DATABASE_URL muss vorher auf die isolierte Testdatenbank gesetzt sein; bei fehlendem Wert bricht das Skript vor Zugriff ab. Reale URLs niemals in Plan, Shell-Historie oder Repository eintragen. Dry-Run erwartet 0 Writes; zweiter Dry-Run nach Apply erwartet 0 Änderungen.

- [ ] Apply prüft Manifestfingerprint und unveränderte Ausgangswerte. Game-Update mit ID, ursprünglichem updatedAt, name und description als Compare-and-Set; bei Konflikt überspringen und Bericht mit Exitcode 1 schreiben. Inline-Vorschläge anhand ID und ursprünglichem bggName vergleichen.
- [ ] Pro Seite kurze Transaktion; geänderte Inline-Vorschläge aktualisieren Event.updatedAt in derselben Transaktion. Erstellungszeiten nicht anfassen. Rollback nur, wenn die aktuellen Felder noch dem angewendeten Manifest entsprechen.
- [ ] Betroffene Spiel-, Dashboard-, Session- und Event-Caches nach dem Lauf gezielt invalidieren; iOS-Daten nach erneutem Sync prüfen.
- [ ] Dry-Run und Apply auf einer isolierten Wegwerfdatenbank durchführen. Ein Produktionslauf ist ein eigener letzter Freigabeschritt nach Prüfung des konkreten Manifests und frischem Backup; im Rahmen der Programmierung niemals automatisch ausführen.
- [ ] Commit: feat: add controlled game text cleanup.

### Aufgabe 4 – Abnahme und Dokumentation

- [ ] Gemeinsame Fixture tests/fixtures/game-text.json für Web-/Mobile-DTO- und Swift-Vertragstests ergänzen. BoardGameTools/BoardGameToolsTests/BoardGameToolsTests.swift prüft nach DTO-Decodierung und SwiftData-Sync den Klartext; keine native HTML-Dekodierung einführen.
- [ ] E2E in tests/e2e/games_test.ts: manuell mit Entities anlegen, bereinigt anzeigen, finden, bearbeiten und neu laden. Ausschließlich isolierte Testkonten.
- [ ] npm run test, npm run typecheck, npm run lint, npm run build, npm run test:ios:contracts und npm run security-check ausführen. Neue Dependency zusätzlich mit npm audit --omit=dev prüfen.
- [ ] Bei 390/1440 px und hell/dunkel lange Sonderzeichennamen sowie sicheren Textinhalt prüfen; Impeccable-Prüfung betrifft hier Textfluss und Anzeige, keine neue Gestaltung.
- [ ] docs/FEATURE-BACKLOG.md, docs/FEATURES.md, CONCEPT.md, src/lib/faq.ts, src/lib/changelog.ts sowie docs/DEPLOYMENT.md aktualisieren. OpenAPI dokumentiert die Klartextsemantik bei unverändertem JSON-Schema; Technologie-/Lizenzinventar anpassen.
- [ ] BUG-049 erst mit Tests und erfolgreichem Codefix schließen. Produktionsbereinigung separat mit Datum, manifestiertem Umfang und Ergebnis dokumentieren; bis dahin „Datenbereinigung offen“ im Featurestatus ausweisen.
- [ ] Commit und npm run review-evaluate:regression; Findingsstatus in skills/code-review/SKILL.md sowie drei Review-Dokumente unter docs/code-reviews/ aktualisieren.

## 5. Abnahmegrenze

Codeabnahme verlangt konsistente Klartextwerte in allen Importpfaden, Web-/Mobile-Ausgabe, Suche und erneutem Sync; keine zusätzliche HTML-Ausführung. Vollständige Featureabnahme verlangt zusätzlich einen freigegebenen, idempotent nachgewiesenen Bestandslauf. Die Erstellung dieses Plans autorisiert weder Installation noch Datenänderung.

## Umsetzungsnachweis – 2026-10-31

- Gemeinsame Normalisierung, BGG-Importe, GameService, Web-/Mobile-Ausgaben,
  Suchpfade und sicheres Klartext-Rendering umgesetzt.
- Wartungs-CLI verwendet ausschließlich `BGT_MAINTENANCE_DATABASE_URL`,
  Dry-Run als Standard sowie geschützte Manifeste und konfliktgeprüfte Apply-/Rollback-Pfade.
- 702/702 Unit-Tests bestanden; `npm run typecheck`, `npm run build`,
  iOS-Vertragstests und `npm run security-check:fast` bestanden. Vollständiger
  ESLint-Lauf: 0 Fehler und 651 Warnungen aus eingebundenen Impeccable-Skripten.
- `npm audit --omit=dev`: 0 Befunde. Vollständiger Audit: 26 bestehende
  Entwicklungsbefunde (1 hoch, 23 mittel, 2 niedrig). E2E und vollständiger
  Security-Check wurden nicht abgenommen.
- Keine isolierte Datenbank (`BGT_TEST_DATABASE_URL` nicht gesetzt), daher
  kein CLI-Lauf gegen eine Datenbank. Kein Produktionszugriff und keine
  Datenbereinigung.
- Impeccable-Detektor: keine blockierenden Befunde; drei Typografiehinweise
  zu bestehenden 10-px-Stellen in `series-entry-card.tsx`.
- Der aktuelle Evaluator-Report wird wegen BUG-051 nicht als gültige
  Bewertung gewertet; kein Regressionsergebnis behauptet. Commit bleibt
  wegen der dokumentierten Review-Sperre BUG-050/051 aus.
