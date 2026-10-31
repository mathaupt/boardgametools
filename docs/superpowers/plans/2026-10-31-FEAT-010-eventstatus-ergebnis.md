# FEAT-010 – Eventstatus und Ergebnis eindeutig darstellen

**Status:** Umsetzung durch Nutzer freigegeben; Aktualitätscheck abgeschlossen.

## Aktualitätsprüfung vor Umsetzung – 2026-10-31

- **Geprüfter Stand:** Commit `c9db58c` (`fix: resolve SEC-45 review regression`); Arbeitsbaum sauber.
- **Ergebnis:** Zustands-/API-Architektur bleibt passend. FEAT-009 ergänzt `public-event.ts` und die Proposal-Textnormalisierung, ändert aber weder Status noch Mutationen.
- **Abhängigkeiten:** FEAT-004 ist weiterhin ausstehend. Löschregeln und Rollen werden nicht vorweggenommen; bestehende Event- und Eventzeilen-Sperren in FEAT-010 berücksichtigen künftige Löschmutationen.
- **Prüfumgebung:** `vitest.integration.config.ts` fehlt und `BGT_TEST_DATABASE_URL` ist nicht gesetzt. Unit-/API-Vertragstests und sichere Integrationstest-Konfiguration sind Teil der Umsetzung; echte DB-Rennen bleiben nur bei verfügbarer isolierter Testdatenbank nachweisbar.
- **Review-Vorlauf:** `npm run review-evaluate:report` mit Registryzugriff, 10/10; SEC-45 teilweise gelöst (22 moderate Dev-Befunde), Produktionsaudit 0. Keine Regression.
- **Scope-Entscheid:** Die im Plan dokumentierten Zustands- und Zeitregeln sind durch „implement FEAT-010“ zur Umsetzung freigegeben. Keine Schema-Migration, kein Gastwechsel, keine FEAT-004-Löschberechtigung und keine Produktionsdatenänderung.

**Ziel:** Öffentliche Gäste und angemeldete Teilnehmer erkennen Status, verbindlichen Termin und ausgewähltes Spiel sofort; geschlossene Aktionen werden durch Web- und Mobile-APIs zuverlässig abgewiesen.

**Architektur:** Eine reine Zustandsfunktion leitet Darstellung und erlaubte Aktionsarten aus echten Eventdaten ab. Ein gemeinsamer transaktionaler Schreibschutz prüft Zustand, Objektzugehörigkeit und Berechtigung unmittelbar vor der Mutation. Der öffentliche Eventkopf rendert das gespeicherte Ergebnis aus einem gemeinsamen Darstellungsmodell.

**Technik:** Next.js 16, TypeScript, Prisma/PostgreSQL, bestehende Auth-/Share-Resolver, Vitest, isolierte PostgreSQL-Integrationstests und CodeceptJS.

**Abarbeitung:** Nach ausdrücklicher Freigabe testgetrieben und in den folgenden abgeschlossenen Schritten. Keine automatische Delegation. Weboberflächen zuerst; native iOS-Oberflächen erhalten einen separaten Plan. Gemeinsame Mobile-API-Schreibregeln gehören zu diesem Umfang.

## 1. Bestand, Risiken und Abhängigkeiten

- src/app/public/event/[token]/page.tsx zeigt „Aktiv“ allein anhand eventDate. status, selectedDate und das gespeicherte Ergebnis bestimmen den Kopf nicht gemeinsam.
- PublicEventClient und DateVotingSection sperren überwiegend anhand isPast; GuestRegistrationPanel besitzt keinen Eventstatus.
- Öffentliche join-/vote-/date-vote-Routen besitzen keine vollständige gemeinsame Zustandsprüfung. Mobile join/vote exportieren dieselben öffentlichen Handler erneut.
- Web-POST /api/events/[id]/votes lädt den Vorschlag nur per ID; DELETE verwendet die Event-ID nicht. Öffentliche Terminabstimmung prüft zwar den Gast, bindet aber nicht alle dateProposalIds an das freigegebene Event. Diese zusätzlich erkannten Objektzugehörigkeitsfehler sind BUG-048.
- Die private DatePoll-Oberfläche sperrt nach selectedDate, die Serverrouten schützen nicht alle entsprechenden Zustände.
- EventService.update akzeptiert status ohne zentrale Übergangsregeln; EventService.close und die Web-/Mobile-Abschlussrouten unterscheiden sich bei Validierung und Gewinnerermittlung.
- Prisma führt status als String. Neben draft/voting/closed verwendet die öffentliche Seite planning. Der native Eventeditor sendet planned/open/closed. Ein neuer strikter Enum ohne Aliasbehandlung würde bestehende Clients aussperren.
- DateProposal.date ist laut Schema ein Kalendertag mit Uhrzeit 00:00. selectedDate darf daher nicht als bestätigte Startzeit 00:00 ausgegeben werden.

**Abhängigkeiten:** FEAT-001 bis FEAT-003 sind umgesetzt. FEAT-004 ist noch nicht freigegeben. Dessen spätere Löschregeln müssen denselben Zustandsschutz und dieselbe Eventsperre nutzen; FEAT-010 erweitert keine Löschrollen. FEAT-011 nutzt den hier geplanten Zustandsvertrag. FEAT-009 kann unabhängig umgesetzt werden.

## 2. Vorgeschlagene Produktregeln zur Umsetzungsfreigabe

### 2.1 Zustände und Zeit

- Interne Normalisierung: planned → draft, open → voting; draft, planning, voting, closed und cancelled sind bekannte Zustände. Andere Werte sind lesbar mit „Status unbekannt“, aber für Mutationen gesperrt.
- Legacy-status im bisherigen JSON-Feld erhalten; keine automatische Datenmigration und kein ungeprüfter Wechsel der nativen Statusbezeichnungen. Der neue abgeleitete Vertrag ist additiv.
- draft: bestehende veröffentlichte Entwürfe bleiben für Teilnahme und Abstimmung offen; diese Kompatibilitätsregel verhindert einen Funktionsverlust durch den Standardstatus neuer Events.
- planning ohne selectedDate: eventDate gilt als vorläufig, nicht als Beweis eines vergangenen bestätigten Termins. Im Kopf steht „Termin wird abgestimmt“ mit vorläufigem Datum statt verbindlicher Startzeit.
- selectedDate hat für den verbindlichen Kalendertag Vorrang. Stimmt der gespeicherte eventDate nicht überein, zeigt die öffentliche Seite trotzdem den gewählten Kalendertag; die Schreibseite stellt künftig die Konsistenz wieder her.
- Bei ausgewähltem DateProposal keine Uhrzeit erfinden. Darstellung „Datum festgelegt · Uhrzeit noch offen“, bis eine eigenständige, belegbare Startzeit vorhanden ist.
- Für date-only-Werte den gespeicherten UTC-Kalendertag verwenden. Als vorgeschlagene Betriebszone für die Tagesgrenze gilt Europe/Berlin; beide Zeitvergleiche und Anzeige nutzen einen gemeinsamen Helper. Eine spätere Zonenverwaltung ist ein eigenes Feature.
- Ein ausgewählter Kalendertag ist erst nach Ablauf dieses Tages vergangen. Ein tatsächlich terminierter eventDate mit Startzeit ist ab diesem Zeitpunkt vergangen. now wird serverseitig nach Erwerb der Eventsperre ermittelt; Clientzeit begründet keine Schreibberechtigung.
- cancelled hat in der Anzeige Vorrang vor „vergangen“; closed bleibt als „Abstimmung geschlossen“ erkennbar, auch wenn zusätzlich „Termin vergangen“ angezeigt wird.
- Eine neue Absage-/Wiedereröffnungsoberfläche gehört nicht zu FEAT-010. Bereits gespeicherte Absagen werden korrekt gelesen; unbekannte Werte werden niemals als „Abgesagt“ erfunden.
- Der bestehende Abschluss bleibt auf den kanonischen Status voting beziehungsweise dessen Alias open beschränkt. Ein Entwurf darf nicht durch einen allgemeinen Update-Request direkt geschlossen werden.

### 2.2 Aktionsmatrix

Voraussetzung jeder Aktion bleibt die eigene Authentifizierung, Objektzugehörigkeit und bestehende Rolle. „Ja“ bedeutet nur, dass der Zustand die Aktion zulässt.

| Zustand | Gastbeitritt | Spiel vorschlagen / Stimme setzen oder entfernen | Terminantwort / Terminvorschläge verwalten | Ergebnis festlegen |
|---|---|---|---|---|
| draft/planning/voting, zukünftiger bestätigter Termin oder Planung offen | Ja | Ja, solange kein Spiel ausgewählt | Ja, solange kein selectedDate | Nur Ersteller und fachlich zulässige Auswahl |
| selectedDate vorhanden, Spielwahl offen | Ja | Ja | Nein; nur explizites Zurücksetzen durch Ersteller vor dem Termin | Spiel nach bestehender Abschlussregel |
| selectedGameId oder winningProposalId vorhanden, Terminwahl offen | Ja | Nein | Ja, sofern status noch offen und Termin nicht vergangen | Kein Überschreiben des Ergebnisses |
| closed | Nein | Nein | Nein | Nein |
| cancelled oder bestätigter Termin vergangen | Nein | Nein | Nein | Nein |
| unbekannter Status / ungültiges Datum | Nein | Nein | Nein | Nein |
| gelöscht / Share widerrufen | Kein Zugriff | Kein Zugriff | Kein Zugriff | Kein Zugriff |

Geschlossene Antworten bleiben lesbar. Die UI zeigt einen kurzen Grund statt bedienbarer Abstimmungsbuttons. Bei veraltet geöffneten Seiten verweigert der Server die Mutation mit 409; vorhandene Stimmen bleiben erhalten und die Ansicht wird aktualisiert.

### 2.3 Ergebnisdarstellung

Im Kopf folgen auf den Titel Status, verbindlicher beziehungsweise vorläufiger Termin, Ort und das tatsächlich gespeicherte ausgewählte Spiel. Priorität des Spiels: winningProposalId mit zugehörigem lokalen Spiel oder Inline-BGG-Daten; sonst selectedGameId. Kein Gewinner wird allein aus der aktuellen Rangliste abgeleitet. Bei geschlossenem Event ohne gespeichertes Ergebnis lautet der Hinweis „Abstimmung geschlossen; kein Spiel festgelegt“.

## 3. Verträge und Dateistruktur

**Neue Dateien:**

- src/lib/events/event-state.ts – pure Normalisierung und Zustandsauswertung.
- src/lib/events/event-date.ts – date-only-Schlüssel, einheitliche Zeitgrenze und Anzeige.
- src/lib/services/event-mutation.service.ts – gemeinsame Eventsperre, Zugriff, Statusprüfung und Objektbindung.
- src/components/public-event/public-event-header.tsx – öffentlicher Kopf mit gespeichertem Ergebnis.
- tests/unit/lib/event-state.test.ts, tests/unit/api/event-state-guards.test.ts, tests/unit/components/public-event-header.test.tsx.
- tests/integration/event-state.test.ts und tests/integration/setup.ts sowie vitest.integration.config.ts, sofern FEAT-004 diese vorher noch nicht eingeführt hat; vorhandene sichere Konfiguration dann erweitern.

**Additiver Rückgabevertrag:** in src/lib/public-event.ts und betreffenden Web-/Mobile-Eventdetails:

```ts
export type EventAction =
  | "join" | "proposeGame" | "voteGame" | "voteDate"
  | "manageDates" | "selectDate" | "resetDates" | "close";

export interface EventState {
  phase: "planning" | "open" | "closed" | "cancelled" | "past" | "unavailable";
  label: string;
  effectiveDate: string | null;
  dateKind: "provisional" | "date" | "datetime";
  evaluatedAt: string;
  available: Record<EventAction, boolean>;
  blockedReason: string | null;
}

export function evaluateEventState(
  event: {
    status: string;
    eventDate: Date;
    selectedDate: Date | null;
    selectedGameId: string | null;
    winningProposalId: string | null;
    deletedAt: Date | null;
  },
  now: Date
): EventState;
```

Die Funktion enthält keine Rollen- oder Datenbanklogik. Das Feld available ist kein Berechtigungsnachweis. Bestehende Felder und Antworten bleiben erhalten; alte Swift-Decoder dürfen die Zusatzfelder ignorieren. selectedDate und Ergebnisdaten müssen auch im betreffenden Detail-DTO vollständig verfügbar sein. Kein neuer öffentlicher Verwaltungsendpunkt.

**DTO-Dateien:** src/lib/sync-types.ts, src/lib/dto-mappers/event.ts und src/app/api/mobile/v1/events/[id]/route.ts ergänzen selectedDate optional und serialisieren vorhandene Werte; src/app/api/events/[id]/route.ts und die öffentliche Serialisierung ergänzen den abgeleiteten Zustand. Öffentliche Mobile-GETs verwenden denselben Re-Export wie bisher. Neue Zusatzfelder sind für vorhandene Swift-Decoder optional beziehungsweise ignorierbar.

## 4. Aufgaben

### Aufgabe 1 – Zeit- und Zustandsmodell mit Verhaltenstests

- [x] npm run review-evaluate:report als Vorlauf. Gezielte Impact-Analyse zu Zugriff, Transaktionen, Mobile-Verträgen und FEAT-004 durchführen.
- [x] tests/unit/lib/event-state.test.ts schreiben. Beispiel:

```ts
it("sperrt ein zukünftiges geschlossenes Event", () => {
  const state = evaluateEventState({
    status: "closed",
    eventDate: new Date("2026-11-06T18:00:00Z"),
    selectedDate: null,
    selectedGameId: null,
    winningProposalId: null,
    deletedAt: null,
  }, new Date("2026-10-31T12:00:00Z"));
  expect(state.phase).toBe("closed");
  expect(Object.values(state.available).every((allowed) => !allowed)).toBe(true);
});
```

- [x] Tests für jede Matrixzeile, beide Legacy-Aliase, unbekannten Status, exact-now-Grenze, fehlendes Ergebnis, widersprüchliche Datumsfelder, Tageswechsel und Sommerzeit ergänzen. planning mit vergangenem Platzhalter bleibt offen.
- [x] npx vitest run tests/unit/lib/event-state.test.ts ausführen und rot nachweisen.
- [x] event-state.ts und event-date.ts gemäß Abschnitt 2 implementieren. Datum-/Statusfehler fail-closed behandeln, keine zufällige Client-/Server-Zeitzone verwenden.
- [x] Tests erneut grün ausführen. Commit: feat: define event lifecycle availability.

### Aufgabe 2 – Servermutationen unter gemeinsamer Eventsperre absichern

**Service-Vertrag:**

```ts
type EventMutationScope =
  | { kind: "user"; eventId: string; userId: string }
  | { kind: "public"; token: string; guestId?: string; userId?: string };

function withEventMutation<T>(
  scope: EventMutationScope,
  action: EventAction,
  write: (context: {
    tx: Prisma.TransactionClient;
    eventId: string;
    now: Date;
  }) => Promise<T>
): Promise<T>;
```

- [x] Service-/Routentests zuerst schreiben: geschlossen/vergangen/abgesagt/unknown → 409 und null Writes; widerrufener Token → 404; fehlende Anmeldung → 401; fehlende Rolle → 403; fremder Vorschlag → 404.
- [x] Zusätzliche BUG-048-Regressionen: User mit Zugriff auf Event A übergibt Vorschlag aus B; GET-Parameter bei DELETE aus A/B mischen; Gast aus A sendet Termin aus B; gemischte Bulk-Liste darf keinen einzigen Datensatz schreiben.
- [x] Mit npx vitest run tests/unit/api/event-state-guards.test.ts den roten Ausgangspunkt belegen.
- [x] In Prisma-Transaktion zuerst die Event-ID auflösen, dann die Zeile parameterisiert sperren:

```ts
await tx.$queryRaw(Prisma.sql`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`);
```

  Anschließend Event frisch lesen, bei öffentlichem Scope shareToken, isPublic und deletedAt erneut prüfen, now ermitteln, bestehenden Rollen-/Einladungszugriff prüfen und evaluateEventState auswerten. work nur bei erlaubter Aktion aufrufen. Rate-Limits bleiben vor der Transaktion; keine externen HTTP-Aufrufe bei gehaltener Sperre.

- [x] Jede betroffene Ressource vor dem Schreiben an eventId binden: GameProposal, DateProposal, GuestParticipant und zu löschende Vote-Relation. Bulk-Terminantworten vollständig validieren, doppelte IDs als 400 ablehnen, danach atomar schreiben.
- [x] Folgende Routen an den Guard anbinden, ohne ihre Authmechanismen oder vorhandenen Antwortfelder zu ersetzen:

| Route | Methoden / Aktion |
|---|---|
| /api/public/event/[token]/join | POST / join |
| /api/public/event/[token]/vote | POST, DELETE / voteGame |
| /api/public/event/[token]/date-vote | POST / voteDate |
| /api/public/event/[token]/propose, /propose-bgg | POST / proposeGame |
| /api/events/[id]/votes | POST, DELETE / voteGame |
| /api/events/[id]/proposals | POST / proposeGame; bestehendes DELETE nur zustandsseitig sperren, Rollen bleiben FEAT-004 |
| /api/events/[id]/date-proposals | POST, DELETE / manageDates |
| /api/events/[id]/date-proposals/vote | POST, DELETE / voteDate |
| /api/events/[id]/date-proposals/select | POST / selectDate |
| /api/events/[id]/date-proposals/reset | POST / resetDates |
| /api/mobile/v1/events/[id]/votes | POST, DELETE / voteGame |
| /api/mobile/v1/events/[id]/proposals | POST und bestehendes DELETE wie Web |
| /api/mobile/v1/events/[id]/date-proposals | POST / manageDates |
| /api/mobile/v1/events/[id]/date-proposals/vote | POST / voteDate |

  Mobile öffentliche join/vote sind Re-Exports: keine doppelte Implementierung; beide URLs testen. GET-Listen bleiben lesbar und prüfen weiterhin ihren Zugriff.

- [x] Erfolgreiche Writes und Event.updatedAt gemeinsam committen. Push-/E-Mail-Benachrichtigungen und Cache-Invalidierung erst nach Commit. Keine Rohdaten, Tokens oder Gastidentitäten in Diagnoseausgaben.
- [x] Gezielte Unit-/API-Tests und die bestehenden tests/unit/api/public-event.test.ts sowie tests/unit/app/api/mobile/v1/events.test.ts ausführen. Commit: fix: guard event mutations and proposal ownership.

### Aufgabe 3 – Abschluss, Datumsauswahl und Statusupdates konsistent machen

**Ändern:** EventService.close/update in src/lib/services/event.service.ts, beide close/route.ts, private select/reset-Routen und Mobile-PUT /api/mobile/v1/events/[id].

- [x] Tests zuerst: Schließen gegen neue Stimme, Schließen gegen Rücknahme, Terminwahl gegen Terminantwort, Zurücksetzen gegen geschlossenen Zustand; ungültige Ergebnis-ID und Ergebnis eines fremden Events abweisen.
- [x] Abschlussberechnung und Speicherung unter derselben Eventsperre durchführen. Vom Mobile-Client übermittelte IDs erneut am Event validieren; nicht aus der Route ungeprüft übernehmen. BGG-only-Gewinner über winningProposalId erhalten.
- [x] Bestehende automatische Auswahl nach Nutzer- plus Gaststimmen erhalten. Bei Gleichstand den gemeinsamen stabilen createdAt-/ID-Vergleich aus FEAT-002 verwenden; die UI-Sortierauswahl verändert keine Abschlussregel.
- [x] selectedDate und eventDate bei Auswahl atomar konsistent schreiben. Date-only-Semantik erhalten und keine bestätigte Uhrzeit behaupten. Beim Zurücksetzen selectedDate löschen und den Planungsstatus explizit setzen; Referenz-/Platzhalterdatum allein sperrt die Planung nicht.
- [x] EventService.update validiert bekannte Statuswerte samt Legacy-Aliasen. Ein angefordertes closed läuft über denselben Abschlussservice; dadurch kann ein alter nativer Editor die Sperre nicht umgehen. Geschlossene/abgesagte Events werden durch einen allgemeinen Update-Request nicht automatisch wieder geöffnet oder vom Ergebnis getrennt.
- [x] Allgemeine Datumsupdates dürfen selectedDate nicht widersprechen: Wechsel auf einen anderen Kalendertag bei bestehender Auswahl mit 409 abweisen, bis die zulässige explizite Zurücksetzung erfolgt. Terminale Zustände erlauben keine stillen Termin-/Ergebnisänderungen.
- [x] Konkurrierende Owner-Updates, Löschung, Share-Widerruf, Auswahl und Abschluss müssen dieselbe Eventzeile sperren. Vor einer Netzwerkabfrage BGG-Daten laden, anschließend unter der Sperre erneut Zustand und Objektbindung prüfen.
- [x] tests/unit/lib/services/event.test.ts und Mobile-Tests grün ausführen. Commit: fix: serialize event selection and closing.

### Aufgabe 4 – Öffentlichen Kopf und Clients anbinden

**Ändern:** src/lib/public-event.ts, src/components/public-event/public-event-client.tsx, guest-registration-panel.tsx, public-proposal-vote-actions.tsx, date-voting-section.tsx, bgg-game-search.tsx, collection-game-proposer.tsx; öffentliche Serverpage und private Voting-/Terminclients. **Neu:** public-event-header.tsx.

- [x] Kopf-/Clienttests schreiben: closed mit zukünftigem Datum zeigt nie „Aktiv“; endgültiger Termin und gespeicherter BGG-only-Gewinner sichtbar; leeres Ergebnis verständlich; kein Gastformular bei closed/past/cancelled.
- [x] EventState im Server berechnen und als additiven Zustand serialisieren. Bei älteren Payloads im Client mit derselben Funktion konservativ ableiten; keine dritte isPast-Regel einführen.
- [x] Bestehende willkürliche status-/isPast-Abfragen durch passende available-Werte ersetzen. Lesbare Vorschläge, Stimmen, Termine und Details bleiben bestehen; unzulässige Schaltflächen durch den konkreten Sperrgrund ersetzen.
- [x] Ein abgelehnter 409 aktualisiert Eventdaten und zeigt „Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.“ Lokale Stimmen nicht vor erfolgreicher Antwort ändern.
- [x] Beim Erreichen einer Zeitgrenze den Clientzustand neu auswerten, zusätzlich bei Rückkehr in den Tab. Serverseitige Prüfung bleibt maßgeblich.
- [x] Kopfkomponente im Club-Programme-Stil mit Status als Text, echter Ergebnisquelle, korrekter Überschriftenhierarchie und ohne neue Teilnehmer-Umsortierung bauen. FEAT-012/013 bleiben gesondert.
- [x] Browserprüfung bei 390/1440 px, hell/dunkel und 200 % Zoom; Impeccable-Kontext/Craft-Floor vor UI-Implementierung laden, gerenderte Detektorprüfung und manuelle Zustandsprüfung durchführen. Commit: feat: show public event status and confirmed result.

### Aufgabe 5 – Echte Zustände und API-Verträge abnehmen

- [x] Separate vitest.integration.config.ts mit environment node, Alias @ → src, include tests/integration/**/*.test.ts und ausschließlich tests/integration/setup.ts anlegen beziehungsweise erweitern.
- [x] Setup verlangt BGT_TEST_DATABASE_URL auf localhost/127.0.0.1 mit Datenbankpräfix bgt_test_. Vor Prüfung kein DB-Modul importieren; niemals .env.prod oder Unit-Mocks laden.
- [x] npx vitest run --config vitest.integration.config.ts tests/integration/event-state.test.ts ausführen: direkte API-/Servicerequests gegen echte offene/geschlossene/abgesagte/vergangene Datensätze; Serialisierungsrennen mit zwei getrennten Verbindungen. Ergebnis entweder gültige Mutation vor Abschluss oder 409 nach Abschluss, niemals nachträglicher Write.
- [x] E2E in tests/e2e/public_events_test.ts ergänzen: öffentliche Seite offen laden, serverseitig schließen, anschließend aus derselben alten Seite abstimmen; Ablehnung, aktualisierter Kopf und unveränderte DB-Stimmen prüfen. Kein synthetischer Erfolgsresponse als Backendnachweis.
- [x] docs/openapi.yaml für additive EventState-Felder, 409-Fehler und betroffene Methoden aktualisieren; deutsche Beschreibungen und { error: string }. Keine privaten Beschreibungen oder Nutzerfelder neu freigeben.
- [x] npm run test, typecheck, lint, build, security-check und test:ios:contracts ausführen. Alte Swift-DTO-Fixture mit Legacy-status und neuer additiver EventState-Struktur muss dekodierbar bleiben.
- [x] BUG-037 und BUG-048 erst nach echten Zustands-/Zugriffstests schließen; Backlog, Feature-Dokumentation, FAQ, Konzept und Changelog aktualisieren. Review-Evaluator und drei Review-Dokumente aktualisieren, Commit erstellen.

## 5. Abnahmegrenze

Frontend allein genügt nicht. Die Freigabe verlangt die Zustandsmatrix an allen betroffenen Schreibwegen, echte DB-Nachweise für Objektbindung und Rennen sowie eine sichtbare korrekte Ergebnisdarstellung. Ein fehlender isolierter PostgreSQL-Testlauf bleibt ein ausdrücklich offener Abnahmepunkt. Die Regeln zu Zeit, Legacy-Status und geschlossener Terminwahl sind mit diesem Plan zur Bestätigung vorgelegt.

## Umsetzungsstand – 2026-10-31

- FEAT-010 ist für Web und Mobile-API umgesetzt. Zustandsmodell, Eventzeilensperre, Event- und Objektzugriffsprüfungen, konsistente Termin-/Ergebnisupdates sowie Web-/öffentliche Statusdarstellung sind enthalten. Die native iOS-Oberfläche bleibt separat zu planen.
- Vier PostgreSQL-Integrationstests gegen einen eigens angelegten lokalen Testcluster bestanden: Wettlauf Vote/Close, geschlossene öffentliche Vote-Route sowie fremde Spiel- und Terminvorschläge ohne Writes.
- Chromium-E2E bestanden: öffentliche Seite offen geladen, Event serverseitig geschlossen, veraltete Seite versucht abzustimmen; die Route lehnt ab, der Status aktualisiert sich, der Button ist gesperrt und es wird keine Stimme gespeichert.
- Gerenderte Browserabnahme bei 390 × 844 px und 1440 × 1000 px, hell und dunkel, sowie bei 195 CSS-Pixeln als 200-%-Zoom-Äquivalent durchgeführt. Keine Viewport-Überläufe; Gastbeitritt und geschlossener Zustand bleiben bedienbar.
- Impeccable-Detektor fand bei der Erstprüfung einen Status-Badge-Kontrast-/Innenabstandsfehler (BUG-058) und einen Hinweis auf eine allein umbrechende Textzeile. BUG-058 wurde mit semantischer Farbe, zusätzlichem Innenabstand und Unit-Test behoben; die Einführung zur Teilnahme wurde gekürzt. Finale Detektorprüfung bei 390 × 844 px: keine Findings.
- BUG-037, BUG-048, BUG-057 und BUG-058 sind behoben und mit Regressionstests beziehungsweise echten DB-/Browsernachweisen abgesichert. Produktionsdaten wurden nicht verändert.
- Finale Validierung: 740 Unit-Tests, TypeScript, Produktionsbuild, PostgreSQL-Integration (4), Chromium-E2E (1), Impeccable-Detektor (0 Findings), iOS-Vertragstests, sowie Lint (0 Fehler; 651 vorhandene Warnungen). Der Commit-Hook führt Security- und Regressionsevaluierung aus.
