# FEAT-031 – Spiele für Event-Partien auswählen: Implementierungsplan

> **Umsetzungsstatus:** Am 09.11.2026 freigegeben und implementiert. Gezielte Unit-Tests wurden lokal ausgeführt; Browser-E2E und manuelle UI-Abnahmen gelten gemäß Nutzeranweisung als angenommen, wurden aber nicht unabhängig ausgeführt.

**Ziel:** Der Event-Ersteller kann eine Partie bevorzugt mit einem Eventvorschlag erfassen und bei Bedarf stattdessen ein eigenes Sammlungsspiel oder ein BGG-Spiel suchen und auswählen.

**Architektur:** Die bestehende Erstellerberechtigung, Session-Service und Snapshotfelder aus FEAT-029 bleiben die Basis. Die Erfassungs-API erhält eine validierte Spielquelle (Eventvorschlag, eigenes Sammlungsspiel oder BGG-ID); Sammlungseigentum und BGG-Metadaten werden serverseitig geprüft. Eventpartien ohne Vorschlag bekommen einen nullable Vorschlagslink, bleiben als normale Sessions erhalten und werden in internen sowie öffentlichen Eventansichten mit der bestehenden Datenschutzgrenze angezeigt.

**Technik:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 7/PostgreSQL, Zod, Vitest/Testing Library, Playwright für gerenderte Browserabnahme, Impeccable.

---

## Aktuelle Bestandsprüfung und Freigabegrenze

- **Geprüft am:** 05.11.2026, Commit `6a7b0c5`; Arbeitsbaum sauber.
- **Bestand:** FEAT-029 erfasst nur `GameProposal`-IDs. `EventPlayedSession.proposalId` ist verpflichtend; die Eventkarte rendert Sessions gruppiert unter Vorschlägen und bietet die Erfassung nur an, wenn Vorschläge existieren. Das Spiel wird bereits als Snapshot in `GameSession` gespeichert; `gameId` ist optional.
- **Vorhandene Suche:** `GET /api/games?q=...` liefert nur Spiele des angemeldeten Kontos; `GET /api/bgg/search?q=...` liefert BGG-Treffer; `GET /api/bgg?bggId=...` lädt serverseitig Detaildaten. `fetchBGGGame` ist als Serverhelfer vorhanden.
- **Berechtigung/Datenschutz:** FEAT-029 beschränkt Anlegen und Bearbeiten auf den Event-Ersteller. Öffentliche Events zeigen nur Spielnamen und gespielt-Status, keine Sessiondetails. Diese Grenze bleibt bestehen.
- **Migration:** Die FEAT-029-Migration ist bereits in Produktion angewendet. FEAT-031 benötigt eine additive Migration, die `EventPlayedSession.proposalId` nullable macht; bestehende Verknüpfungen bleiben unverändert.
- **Plattform:** Web/API. Native iOS-Oberflächen sind nicht Teil dieses Plans.
- **UI-Richtung:** Bestehende Club-Programme-Oberfläche behalten. Eventvorschläge sind die voreingestellte Primärquelle; Sammlung und BGG werden als klar beschriftete alternative Suchquellen angeboten. Keine neue Navigationsseite.
- **Freigabe:** Der Nutzer hat am 09.11.2026 mit der ausdrücklichen Anweisung, die offenen Features der Reihe nach umzusetzen, FEAT-031 freigegeben. Die manuellen und Browser-E2E-Abnahmen dürfen gemäß derselben Anweisung als bestanden angenommen werden; sie werden nicht als eigenständig ausgeführt dokumentiert.

## Dateien und Zuständigkeiten

- `prisma/schema.prisma`, neue Migration `prisma/migrations/YYYYMMDDHHMMSS_feat031_optional_event_proposal/`: optionaler FK `EventPlayedSession.proposalId`; bestehende Links bleiben erhalten.
- `src/app/(dashboard)/dashboard/events/[id]/played-session-form.tsx`: Event-, Sammlungs- und BGG-Auswahl in einem zugänglichen Formular; die übrigen Sessionfelder bleiben erhalten.
- `src/app/(dashboard)/dashboard/events/[id]/played-sessions-card.tsx`: Erfassung auch ohne Vorschläge ermöglichen; Vorschlags-Sessions und Sessions ohne Vorschlag darstellen.
- `src/app/(dashboard)/dashboard/events/[id]/page.tsx`: eigene Vorschlag-unabhängige Event-Sessions laden und serialisieren; Sammlung nicht an den Client übergeben, da Suche über die geschützte API läuft.
- `src/app/api/events/[id]/played-sessions/route.ts`: striktes diskriminiertes Quellen-Schema für `proposalId`, `collectionGameId` oder `bggId`.
- `src/lib/services/event-played-session.service.ts`: Erstellerprüfung, Quelle serverseitig auflösen, Eigentum/Existenz prüfen, Snapshot herstellen, atomare Session-/Linkanlage und Idempotenz erhalten.
- `src/lib/public-event.ts`, öffentliche Eventseite/Komponenten: zusätzliche gespielte Spiele ohne Vorschlag ausschließlich als Titel/Status serialisieren.
- `tests/unit/components/played-session-form.test.tsx` (neu) und `tests/unit/components/played-sessions-card.test.tsx`: Quellenwahl, Suche, Lade-/Leer-/Fehlerzustände, keine Vorschläge, Speicherung.
- `tests/unit/api/event-played-sessions.test.ts`, `tests/unit/lib/services/event-played-session.service.test.ts`: Inputvertrag, Auth, Eigentum, BGG-Auflösung, Idempotenz und Fehlerfälle.
- `tests/unit/lib/public-event.test.ts` und `tests/unit/components/public-event-client.test.tsx`: öffentliche Projektion ohne Session- oder Teilnehmerdetails.
- `tests/integration/feat031-migration.test.ts` (neu): Schema-/Constraint-Vertrag gegen ausschließlich isolierte PostgreSQL-Testdatenbank.
- `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, `CONCEPT.md`, `docs/FEATURE-BACKLOG.md`, `src/lib/changelog.ts`: API-/Produktdokumentation und Featurestatus.
- `.impeccable/critique/`: gerenderte Browserbelege und Ergebnis des Impeccable-Checks.

## Task 1: Optionalen Vorschlagslink migrieren

**RED:** `tests/integration/feat031-migration.test.ts` prüft, dass `EventPlayedSession.proposalId` nullable ist und bestehende Eindeutigkeits-/Fremdschlüsselverträge weiter bestehen. Zuerst gegen eine isolierte DB mit bisherigem FEAT-029-Schema ausführen:

```bash
SQL_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx vitest run tests/integration/feat031-migration.test.ts
```

Erwartet: gezieltes Schematestergebnis rot, weil `proposalId` noch `NOT NULL` ist. `BGT_TEST_DATABASE_URL` muss auf eine isolierte Testdatenbank zeigen; niemals `.env.prod` verwenden.

**GREEN:** `EventPlayedSession.proposalId` und die Prisma-Relation nullable machen, eine neue Migration mit `ALTER TABLE "EventPlayedSession" ALTER COLUMN "proposalId" DROP NOT NULL` erstellen und Prisma Client generieren. Nur auf die isolierte Testdatenbank migrieren:

```bash
SQL_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx prisma migrate deploy
SQL_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx vitest run tests/integration/feat031-migration.test.ts
```

Erwartet: Migration angewendet; Schematest besteht, alte Zeilen und Constraints sind erhalten.

**REFACTOR:** `npx prisma validate` und den Migrationstest erneut ausführen; keine Produktionsmigration oder `db push`.

## Task 2: Quellenauflösung und API-Vertrag

**RED:** In `event-played-sessions.test.ts` je einen Route-Test für erlaubte `proposalId`, `collectionGameId` und numerische `bggId` ergänzen; unbekannte oder mehrere gleichzeitige Quellen müssen vor Serviceaufruf HTTP 400 liefern. In `event-played-session.service.test.ts` Eigentumsverletzung bei fremdem Sammlungsspiel, gelöschtes Spiel und nicht auflösbare BGG-ID als gezielte Fehlerfälle ergänzen. Bestehende Tests bleiben unverändert gültig.

```bash
npx vitest run tests/unit/api/event-played-sessions.test.ts tests/unit/lib/services/event-played-session.service.test.ts
```

Erwartet: die neuen Quellenverträge scheitern an der bisherigen proposal-only-Validierung beziehungsweise Serviceauflösung.

**GREEN:** `playedSessionSchema` als strikte discriminierte Auswahl abbilden. Service prüft weiterhin zuerst Eventexistenz und Erstellerrolle; danach lädt er genau eine Quelle:

- `proposalId`: Vorschlag muss zum angegebenen Event gehören.
- `collectionGameId`: Spiel muss dem angemeldeten Ersteller gehören und nicht soft-gelöscht sein; `gameId` bleibt gesetzt.
- `bggId`: nur numerische BGG-ID serverseitig mit `fetchBGGGame` auflösen; BGG-Name/URL/Metadaten nicht aus Clientpayload übernehmen. Bei Treffer wird ein Session-Snapshot ohne neuen Sammlungseintrag erstellt; besitzt der Ersteller bereits ein aktives Spiel mit dieser BGG-ID, wird dieses Spiel verknüpft. Bei fehlendem BGG-Spiel wird keine Session geschrieben.

Alle Quellen verwenden dieselbe atomare Anlage und dieselbe `(eventId, operationId)`-Idempotenz. Der Link wird bei `proposalId` gesetzt, sonst `null`. Nutzer-/Gastteilnehmerprüfung und Cacheinvalidierung bleiben bestehen. BGG-Fehler dürfen keine halbe Session hinterlassen.

```bash
npx vitest run tests/unit/api/event-played-sessions.test.ts tests/unit/lib/services/event-played-session.service.test.ts
```

Erwartet: alle Quellen-, Eigentums-, IDOR-, BGG-Fehler-, Teilnehmer- und Retrytests bestehen.

**REFACTOR:** gemeinsame Snapshotbildung in einen kleinen Servicehelper ziehen, falls Tests Duplikate zeigen; Zod-Union und OpenAPI-Requestschema abgleichen, TypeScript-Fehlerfreiheit mit `npm run typecheck` bestätigen.

## Task 3: Erfassungsformular und Eventkarte

**RED:** `played-session-form.test.tsx` testen: Eventquelle ist anfänglich aktiv; Umstieg auf Sammlung löst `/api/games?page=1&limit=8&q=catan` mit Suchbegriff aus; BGG startet Suche erst bei mindestens zwei Zeichen und Auswahl speichert BGG-ID; Lade-, leere und Fehlerzustände sind verständlich; Form kann ohne Eventvorschläge dennoch gespeichert werden. `played-sessions-card.test.tsx` prüft Erstelleraktion bei leerer Vorschlagsliste und Anzeige einer vorschlagslosen Partie.

```bash
npx vitest run tests/unit/components/played-session-form.test.tsx tests/unit/components/played-sessions-card.test.tsx
```

Erwartet: neue Tests scheitern an proposal-only-Auswahl, fehlender Suche und ausgeblendeter Creator-Aktion ohne Vorschläge.

**GREEN:** kleine, beschriftete Quellenwahl „Eventspiele“, „Sammlung“, „BoardGameGeek“ in der bestehenden Form ergänzen. Eventspiele bleiben Standard. Sammlung verwendet den bestehenden authentifizierten Listenendpunkt mit begrenzter Suche (`/api/games?page=1&limit=8&q=...`) und Ergebniszahl. BGG verwendet die vorhandene Suche; ausgewählter Treffer wird per Detailendpunkt aufgelöst beziehungsweise die API erhält nur dessen BGG-ID. Für Quellenwechsel Ergebnis-/Fehlerzustand zurücksetzen. Spielauswahl und Datum, Dauer, Notizen, Teilnehmer und Ergebnisse in derselben Form halten. Ausgewählte Spiele auf Desktop und Mobilansicht mit Text und optionalem Cover zeigen; Mindestzielgrößen, Labels, Fokus und `role=status`/`role=alert` erhalten.

Die Eventkarte zeigt Sessionlinks unter den jeweiligen Vorschlägen wie bisher. Vorschlagslose Sessions erscheinen in einer separaten Gruppe „Weitere gespielte Spiele“. Der Ersteller kann „Partie erfassen“ auch bei null Vorschlägen öffnen.

```bash
npx vitest run tests/unit/components/played-session-form.test.tsx tests/unit/components/played-sessions-card.test.tsx
```

Erwartet: Form- und Kartenfälle bestehen; bestehende FEAT-029-Komponentenverträge bleiben grün.

**REFACTOR:** Formularquellenauswahl nur dann extrahieren, wenn Datei die Projektgrenze von etwa 300 Zeilen überschreitet; Tastatursteuerung, Rücksetzen des Operation-IDs-Vertrags bei neuem Formular und Doppelsubmit prüfen.

## Task 4: Private und öffentliche Eventprojektionen

**RED:** In Eventseiten-/Serializer-Tests vorschlagslose Sessions einführen. Intern muss Titel und Sessiondetail korrekt erscheinen; öffentlich darf nur der Spieltitel in der gespielten Liste erscheinen. Teilnehmer, Gastnamen, Ergebnisse, Dauer, Notizen und Session-ID dürfen nicht in der öffentlichen Serialisierung enthalten sein.

```bash
npx vitest run tests/unit/lib/public-event.test.ts tests/unit/components/public-event-client.test.tsx
```

Erwartet: gezielter Fehlschlag, weil Public DTO und interne Eventkarte aktuell nur Sessions mit Vorschlagslink abbilden.

**GREEN:** Eventdetail lädt `event.playedSessions` zusätzlich zu den verschachtelten Vorschlag-Sessions, mit expliziter Projektion und Filter `session.deletedAt: null`; `proposalId: null` wird unter „Weitere gespielte Spiele“ gerendert. Public serializer erhält eine Liste der Spiel-Snapshots dieser Links, deren Vorschlag fehlt. Public React zeigt Titel und Spielstatus ohne Sessionfelder und ohne öffentliche Schreibaktion.

```bash
npx vitest run tests/unit/lib/public-event.test.ts tests/unit/components/public-event-client.test.tsx tests/unit/components/played-sessions-card.test.tsx
```

Erwartet: interne Ansicht zeigt vollständige Details nur für bestehende autorisierte Eventseite; Public DTO/UI zeigt ausschließlich Spieltitel/Status.

**REFACTOR:** keine `include: { user: true }`-Prisma-Relation ergänzen; Userfelder weiterhin explizit selektieren. Datenschutztests mit verdächtigen Notizen/Gastnamen müssen die Abwesenheit dieser Werte ausdrücklich prüfen.

## Task 5: Migration, UI-Abnahme und Dokumentation

**RED/GREEN/REFACTOR:** Migration in isolierter Datenbank mit altem FEAT-029-Schema und bestehenden verknüpften Datensätzen abnehmen; nach Deployment müssen alte Links unverändert, neue `proposalId: null`-Links zulässig und `EventPlayedSession.sessionId` weiterhin eindeutig sein. Keine Produktionsdatenbank im Test verwenden.

```bash
SQL_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx prisma migrate deploy
SQL_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx vitest run tests/integration/feat031-migration.test.ts
npm run typecheck
npm run lint -- --max-warnings=0
npx vitest run tests/unit/api/event-played-sessions.test.ts tests/unit/lib/services/event-played-session.service.test.ts tests/unit/components/played-session-form.test.tsx tests/unit/components/played-sessions-card.test.tsx tests/unit/lib/public-event.test.ts tests/unit/components/public-event-client.test.tsx
```

Erwartet: isolierte Migration, Typecheck, Lint und alle gezielten Tests bestehen. Danach vollständige `npm run test:coverage`, Security-Check, `npm run review-evaluate:regression` und Produktionsbuild gemäß aktuellen Gates ausführen.

**Impeccable:** Lokalen Server starten und FEAT-031-Formular mit vorhandenen Eventvorschlägen, ohne Vorschläge, Suchetreffern, leeren Treffern und Fehlern bei 390 px sowie Desktopbreite rendern. Theme light/dark, Tastatur, Fokus und Screenreaderlabels prüfen; Screenshots/Detectorbefund unter `.impeccable/critique/` ablegen. Den bestehenden Club-Programme-Stil beibehalten und Findings vor Abnahme korrigieren. Browser- und Impeccable-Prüfung sind verpflichtend.

**Security:** Erstellerautorisierung auf jeder Schreibanfrage; Sammlungsspiel-ID ausschließlich gegen `ownerId`/`deletedAt` prüfen; BGG nur mit Ziffern-ID und bestehendem serverseitigem BGG-Client ansprechen; externe Metadaten aus BGG serverseitig holen; Größenlimits/Teilnehmerregeln/Zod-Strictness erhalten; Event-/Operation-ID auf eventgebundene Idempotenz prüfen; öffentliche Projektion auf minimale Spieltitel beschränken; keine privaten Sessionfelder öffentlich rendern. Gezielt mit positiven und negativen API-/Serializer-Tests belegen.

**Dokumentation:** OpenAPI (Quellen-Union), `FEATURES.md` (Quellenwahl/öffentliche Anzeige), FAQ (Eventpartie außerhalb der Vorschläge), `CONCEPT.md` nur falls Produktbereich verändert, Backlogstatus und Changelog aktualisieren. Bugregister nur bei tatsächlich gefundenem separatem Defekt.

## Betriebsgrenze

Die additive Migration wurde lokal und nach gesonderter Rolloutfreigabe auch in Produktion angewendet. Der Code-Deploymentstand folgt nach Veröffentlichung des geprüften Commits.


## Aktualitätsprüfung und Umsetzungsfreigabe – 09.11.2026

- Vor Umsetzung abgeglichen: `git status --short --branch` sauber auf `main`, aktueller Commit `7b4a290` (Produktionsstand `READY`); FEAT-029 inzwischen vollständig ausgeliefert, Eventdauer-Migration `20261105214500_event_duration` in Produktion. FEAT-029-Endpunkte und Sessionservices sind im Plan bezeichnet; diese Bestandsangaben aus dem 05.11. sind vor jedem TDD-Schritt erneut mit dem Code zu vergleichen.
- Umfang der Freigabe: ausschließlich FEAT-031 Web/API inklusive geplanter additiver Schemaänderung für optionales `proposalId`. Der Nutzer hat nun ausdrücklich die offenen Features insgesamt zur Umsetzung freigegeben. iOS bleibt separat. Produktionsmigration und Deployment werden vor der jeweiligen Betriebsänderung konkret mit dem dann aktuellen Nachweis vorbereitet.
- Die bestehende FEAT-029-Berechtigungsgrenze und öffentliche Minimalprojektion bleiben zentrale Abnahmekriterien. Manuelle/E2E-Tests dürfen entsprechend der Nutzerweisung angenommen, nicht als tatsächlich ausgeführt dargestellt werden.

## Umsetzung – 09.11.2026

- **RED/GREEN:** Route-/Service-Tests schlugen zunächst wegen des alten Vorschlagsvertrags fehl; nach diskriminierter Quellenunion bestehen alle gezielten Tests. Sammlungsspiele werden mit `ownerId` und `deletedAt: null` geprüft, BGG-Details serverseitig geladen, Idempotenz und Teilnehmendenprüfung bleiben erhalten.
- **Datenbank:** `proposalId` ist nullable; die additive Migration wurde auf `bgt_test_feat031` angewendet. Der Integrationstest bestätigt Nullable-Status und bestehende Eindeutigkeits-Constraints.
- **UI/Datenschutz:** Formular bietet Eventvorschlag, private Sammlung und BGG-Suche. Vorschlagslose Partien erscheinen intern; der Public-DTO enthält nur den Spieltitel und den Status. Serializer-Tests prüfen das Fehlen von Session-ID, Notizen und Teilnehmernamen.
- **Gezielte Prüfung:** 56 Unit-Tests und `npm run typecheck` bestanden.
- **Vollständige Abdeckung:** 1.436/1.436 Unit-Tests aus 229 Dateien; Statements 85,01 %, Branches 80,07 %, Functions 84,53 %, Lines 87,25 %. `src/data/quality-metrics.json` wurde durch das erfolgreiche Coverage-Skript aktualisiert.
- **Abnahmeannahme:** Browser-E2E, manuelle Tastatur-/Screenreader- und gerenderte Impeccable-Prüfung werden auf Nutzerwunsch als bestanden angenommen; sie wurden nicht tatsächlich ausgeführt. Produktionsmigration und Deployment bleiben offen.

## Rollout-Freigabe und Aktualitätsprüfung – 09.11.2026

- Nutzer hat den Rollout ausdrücklich freigegeben, wenn zuvor ein frisches Produktionsbackup und Schema-Readback erfolgt sind.
- Aktueller Code-Commit: `bb84e33` auf lokalem `main`, noch nicht gepusht. Arbeitsbaum vor Betriebsarbeit sauber. Die FEAT-031-Migration `20261109124500_feat031_optional_event_proposal` ist lokal gegen `bgt_test_feat031` angewendet; Integrationstest, Typecheck, Build und vollständige Coverage-Suite bestehen.
- Genau vorgesehene Produktionsänderung: `ALTER TABLE "EventPlayedSession" ALTER COLUMN "proposalId" DROP NOT NULL;` Keine Backfill- oder Datenänderung. Vor der Ausführung zuerst frisches konsistentes Backup wiederherstellen und `prisma migrate status` auslesen; danach ausschließlich `npm run prisma:deploy`, anschließend Schema und Migrationsstatus read-only prüfen.
- Deployment erfolgt erst nach erfolgreichem Schema-Readback durch Push des bereits geprüften Commits; keine Produktionsmigration, falls Backup/Restore oder Ausgangsschema vom Plan abweichen.
- **Produktionsnachweis 09.11.2026:** Snapshot `backups/boardgametools_20261109_pre_feat031.snapshot.json.gz`, 34 Tabellen/987 Zeilen, SHA-256 `c913312df7ab7508e9a7fa634f04c8d12d72b4b6b56c9a656610e80c584b10d8`, Modus 0600; in `bgt_test_feat031_restore_20261109` vollständig wiederhergestellt und alle Tabellenzeilenzahlen abgeglichen. Vorheriger Readback: eine offene Migration, `proposalId NOT NULL`, 2/2 vorhandene Links erhalten.
- Ausschließlich `20261109124500_feat031_optional_event_proposal` über `npm run prisma:deploy` angewendet. Danach read-only bestätigt: `proposalId` nullable, 2/2 vorhandene Links erhalten, 20 Migrationen abgeschlossen, 0 inkonsistent, Status up to date.
