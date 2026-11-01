# FEAT-013 – Aktive Identität verständlich machen

**Status (2026-11-01):** Web-Implementierung und automatisierte Code-Abnahme abgeschlossen. Browser-E2E, Mehridentitäten- und visuelle Abnahme bei 390/1440 px, Hell/Dunkel und 200 % Zoom stehen noch aus. Umsetzung gemäß ausdrücklicher Freigabe vom 2026-11-01.

**Aktualitätsprüfung vor Umsetzung:** FEAT-012 wird gemeinsam umgesetzt und nutzt diesen Actor als einzige Identitätsquelle; FEAT-014s Zustandskonflikte und tokengebundene BGG-Katalogabfrage bleiben erhalten. Die bestätigte Entscheidung „Klare Identität ohne Gastwechsel“ gilt weiter. BUG-053 bleibt ausdrücklich offen.

**Implementierungsnachweis:** Unit-Suite 822/822, Typecheck, Lint (0 Fehler), Build, Security-Check und OpenAPI-Parsing erfolgreich. iOS-Vertragstest separat dokumentiert. Keine Browser- oder Screenreader-Abnahme behauptet.

**Bestätigte Produktentscheidung:** Am 31.10.2026 ausdrücklich gewählt: „Klare Identität ohne Gastwechsel“. Kein Wechsel zwischen fremden Gastzugängen, keine Umbenennung und keine Übertragung/Zusammenführung bestehender Stimmen.

**Ziel:** Auf der öffentlichen Eventseite ist erkennbar, als welche Person gehandelt wird; angemeldete Personen erhalten einen einzigen Teilnahmeweg und keine parallele Gastaktion.

**Architektur:** Eine reine Funktion und ein kleiner Clientadapter leiten genau einen UI-Actor aus der serverseitigen Session und dem vorhandenen Gerätestate ab. Alle Spiel-/Terminaktionen verwenden denselben Actor. Serverseitig wird bei BGG-Vorschlägen genau eine Autorenrelation geschrieben.

**Technik:** React/TypeScript, bestehende NextAuth-Session, öffentliche Eventserialisierung und LocalStorage-Adapter, Vitest/Testing Library und CodeceptJS. Keine neue Bibliothek, kein Datenbankschema und kein neuer Authendpunkt.

**Abarbeitung:** Nach ausdrücklicher Umsetzungsfreigabe testgetrieben in den folgenden Schritten; keine automatische Delegation. Web zuerst; native iOS-Oberflächen werden nicht umgebaut.

## 1. Bestand und Grenzen

- PublicEventClient liest einen Gast aus LocalStorage, auch wenn currentUserId vorhanden ist.
- PublicProposalVoteActions rendert bei angemeldeten Personen sowohl die Konto- als auch die Gastaktion. Terminantworten priorisieren dagegen bereits currentUserId. Derselbe Bildschirm verwendet dadurch unterschiedliche Identitätsregeln.
- BggGameSearch übergibt activeGuestId auch bei vorhandener Session. Die öffentliche propose-bgg-Route kann gleichzeitig proposedById und guestId speichern (BUG-054).
- Öffentlich serialisiert wird bisher currentUserId, jedoch kein eigenes datensparsames Anzeigemodell für die aktive Kontenidentität.
- Gespeicherte Gast-ID und Spitzname sind keine Authentifizierung. Die bestehende join-Route kann einen vorhandenen Spitznamen per upsert wieder aufnehmen, ohne Besitz nachzuweisen (BUG-053).

**Explizite Sicherheitsgrenze:** FEAT-013 führt keinen Gastwechsel und keine neue Wiederaufnahme fremder Gastidentitäten ein. BUG-053 bleibt ein eigenständiger offener Sicherheitsbefund. Der UI-Actor ist niemals ein Berechtigungsnachweis, keine Löschberechtigung und keine Grundlage für zusätzliche private Datenfreigabe. Vor einer späteren Gastwechsel-/Wiederaufnahme-Erweiterung muss ein serverseitiger Besitznachweis separat geplant und umgesetzt werden.

**Abhängigkeiten:** FEAT-010 liefert zustandsabhängig zulässige Aktionen. FEAT-012 verwendet diese Identitätsanzeige im Teilnahmebereich; FEAT-014 verwendet denselben Actor für Vorschläge. Es darf keine Kopie der Actorregeln in den Nachbarfeatures entstehen.

## 2. Identitäts- und Textvertrag

| Situation | Aktive Identität | Sichtbarer Teilnahmeweg |
|---|---|---|
| Session mit userId | Konto, unabhängig von gespeichertem Gast | „Du bist angemeldet als …“; eine Kontoaktion |
| Keine Session, Gerätestate wird geladen | loading | „Teilnahme wird geladen …“; noch keine Mutation |
| Keine Session, gültiger gespeicherter Gast im aktuellen Event | Gast | „Du nimmst als Gast … teil“; eine Gastaktion |
| Kein gültiger Gastzustand | observer | Spitznamenformular und Link zur Anmeldung |
| 401 während Kontoaktion | Kontoaktion gesperrt bis Aktualisierung | Hinweis auf abgelaufene Anmeldung; kein stiller Gast-Fallback |
| Event geschlossen/vergangen | Gleiche erkennbare Identität | Gespeicherte Angaben und Sperrgrund; keine neue Teilnahme |

- Sessiondaten haben immer Vorrang. Kontonamen aus session.user.name verwenden; ohne Name „Du bist angemeldet“, keine E-Mail oder interne ID als Ersatz veröffentlichen.
- Actoranzeige nur einmal oberhalb der Aktionen. „Abstimmen“, „Stimme entfernen“, „Spiel vorschlagen“, „Termine beantworten“ statt „User voten“, „Votes“ oder „Gastmodus“.
- Gastspitznamen gegen die aktuelle öffentliche Gästeliste anhand ID abgleichen; den aktuellen Server-Anzeigenamen verwenden. Dies prüft nur Existenz/Zugehörigkeit, nicht Besitz.
- Fehlerhafter/veralteter LocalStorage-State erzeugt keinen Request zur automatischen Registrierung oder Spitznamenübernahme. Neutral zum Teilnahmeformular zurückkehren und bei Bedarf verständlich erklären, dass der gespeicherte Zugang nicht verfügbar ist.
- Storageausfall blockiert nicht die aktuelle Teilnahme im Arbeitsspeicher. Nur erfolgreiche Serveraktionen persistieren; vorhandene Angaben nicht pauschal löschen.
- Bestehende Gaststimmen bleiben bestehen, wenn die Person sich anmeldet. Sie werden weder als Kontostimmen angezeigt noch automatisch kopiert oder entfernt.
- Kein neuer Gastwechsel-/Abmelden-/Zurücksetzen-Button. Ein späterer bewusster Logout über die bestehende Kontonavigation wird erst nach erneuter Sessionauflösung ausgewertet.
- Bestehende lokale Gast-Stimmenmarkierungen sind UI-Hinweise des vorhandenen Gerätezustands. Keine neue API zur Abfrage persönlicher Gaststimmen allein über eine erratbare Gast-ID anlegen.

## 3. Gemeinsamer UI-Vertrag und Dateien

```ts
export type PublicActor =
  | { kind: "loading" }
  | { kind: "observer" }
  | { kind: "user"; userId: string; displayName: string | null }
  | { kind: "guest"; guestId: string; nickname: string };

export function resolvePublicActor(input: {
  user: { id: string; name: string | null } | null;
  hydrated: boolean;
  storedGuest: { id: string; nickname: string } | null;
  guests: readonly { id: string; nickname: string }[];
}): PublicActor {
  if (input.user) {
    return { kind: "user", userId: input.user.id, displayName: input.user.name };
  }
  if (!input.hydrated) return { kind: "loading" };
  const guest = input.guests.find((item) => item.id === input.storedGuest?.id);
  return guest
    ? { kind: "guest", guestId: guest.id, nickname: guest.nickname }
    : { kind: "observer" };
}
```

| Datei | Aufgabe |
|---|---|
| src/lib/events/public-actor.ts | Neuer reiner Actorvertrag und Resolver |
| src/components/public-event/use-public-actor.ts | Neuer defensiver Storage-/Hydrationsadapter |
| src/components/public-event/public-identity-notice.tsx | Neue einmalige Identitätsanzeige |
| src/lib/public-event.ts, src/app/public/event/[token]/page.tsx | Minimales Session-Anzeigemodell als eigenes Prop liefern |
| src/components/public-event/public-event-client.tsx | Actor ableiten, eigene Stimmen an Actor/Eventgeneration binden |
| src/components/public-event/public-proposal-vote-actions.tsx | Genau eine Actoraktion rendern |
| src/components/public-event/guest-registration-panel.tsx | Formular nur für observer; keine Konto-/Gast-Doppelanzeige |
| src/components/public-event/date-voting-section.tsx | Actor statt unabhängiger Konto-/Gastentscheidung verwenden |
| src/components/public-event/bgg-game-search.tsx, collection-game-proposer.tsx | Actorgebundene Vorschlagsaktionen |
| src/app/api/public/event/[token]/propose-bgg/route.ts | Session priorisieren; genau eine Autorenrelation schreiben |
| src/components/public-event/types.ts | Bestehenden StoredGuestState defensiv adaptieren |

Anzeigedaten der Session als separates Prop weitergeben; öffentliche GET-Antworten enthalten nur bei tatsächlich eigener Session optional currentUser: { id, name }. Keine E-Mail und keine zusätzliche Profilinformation. Alte Mobile-Decoder dürfen optionale Zusatzfelder ignorieren.

Sessionabhängige öffentliche Antworten bleiben private, no-store und erhalten Vary: Cookie. Die Serverpage behält revalidate=0. In einem Test mit zwei Sessions darf niemals der Anzeigebezug oder Stimmenzustand des anderen Kontos wiederverwendet werden.

## 4. Aufgaben

### Aufgabe 1 – Actorregeln testgetrieben festlegen

**Neu:** tests/unit/lib/public-actor.test.ts und tests/unit/components/use-public-actor.test.tsx.

- [ ] Vorlauf npm run review-evaluate:report; BUG-050/051 nicht als erledigte Paket-/Evaluatorprüfung behandeln.
- [ ] Folgenden Test zuerst schreiben:

```ts
it("priorisiert das Konto vor einem gespeicherten Gast", () => {
  const actor = resolvePublicActor({
    user: { id: "u1", name: "Anna" },
    hydrated: false,
    storedGuest: { id: "g1", nickname: "Alex" },
    guests: [{ id: "g1", nickname: "Alex" }],
  });
  expect(actor).toEqual({ kind: "user", userId: "u1", displayName: "Anna" });
});
```

- [ ] Weitere Fälle: loading ohne Session, observer nach Hydration, Gast aus anderem Event, aktualisierter Server-Spitzname, kaputtes JSON, gesperrtes Storage, Kontowechsel und fehlender Kontoname.
- [ ] npx vitest run tests/unit/lib/public-actor.test.ts tests/unit/components/use-public-actor.test.tsx ausführen; roten Ausgangspunkt belegen.
- [ ] Resolver aus Abschnitt 3 implementieren. Storage nur im passenden anonymen Kontext lesen; Typen/Längen prüfen und gespeicherte Vote-IDs auf die aktuelle Vorschlagsliste begrenzen.
- [ ] Token-/Sessionwechsel erhöhen die Actor-/Requestgeneration. Eigene temporäre Auswahl des vorherigen Actors nicht weiterverwenden.
- [ ] Tests grün ausführen. Commit: feat: define a single public event actor.

### Aufgabe 2 – Einen Teilnahmeweg und verständliche Aktionen darstellen

**Erweitern:** tests/unit/components/public-proposal-vote-actions.test.tsx, guest-registration.test.tsx und date-voting.test.tsx. **Neu:** tests/unit/components/public-identity-notice.test.tsx.

- [ ] Vor Umbau Tests schreiben: Konto mit gespeichertem Gast zeigt genau einen Abstimmungsbutton und kein Gastformular; Gast sieht Spitzname und nur Gastaktion; observer kann nicht versehentlich abstimmen.
- [ ] public-identity-notice.tsx mit semantischem Text statt farbabhängiger Kennzeichnung implementieren. loading mit role=status; Fokus nicht automatisch verschieben.
- [ ] PublicProposalVoteActions auf actor, hasVoted, busy, disabled und onToggle vereinfachen. Ein aus dem Actor abgeleiteter Handler verwendet die passende bestehende API.
- [ ] Konto: /api/events/[id]/votes. Gast: /api/public/event/[token]/vote mit der bestehenden eventgebundenen Gast-ID. Observer/loading: keine Mutation.
- [ ] Für Terminantworten, BGG-Vorschläge und Sammlung dieselbe Routingregel verwenden. Sammlung nur bei Kontoactor laden; niemals die Sammlung eines früheren Kontos aus einem verbliebenen Clientstate zeigen.
- [ ] Kontostimmen aus userHasVoted des frischen Session-Snapshots ableiten; Gastmarkierungen getrennt halten. Nach 401 Session/Eventdaten aktualisieren und nicht automatisch eine gespeicherte Gast-ID verwenden.
- [ ] Antwort einer älteren Actor-/Eventgeneration nicht in die aktuelle persönliche Auswahl schreiben. Erfolgreiche alte Serverwrites können per frischem Eventsnapshot sichtbar werden; ihre Identität nicht nachträglich umdeuten.
- [ ] Alle Labels auf verständliches Deutsch umstellen; angemessene 44-px-Ziele, Kontraste und sichtbaren Fokus nach FEAT-011 beibehalten.
- [ ] Tests grün ausführen. Commit: feat: show one clear participation identity.

### Aufgabe 3 – Eindeutige serverseitige Autorenzuordnung

**Neu:** tests/unit/api/public-proposal-actor.test.ts.

- [ ] Regression für BUG-054 zuerst schreiben: gültige Session plus alte guestId ergibt einen Vorschlag mit proposedById der Session und guestId null.
- [ ] Ohne Session: gültiger eventgebundener Gast ergibt proposedById null und guestId des Gasts; ohne beides 401; Gast aus anderem Event 404.
- [ ] Bei vorhandener Session das übermittelte Legacy-guestId-Feld für die Autorenzuordnung nicht verwenden. Keine zusätzliche Gastabfrage und keine zweifache Relation aus einem alten Clientrequest schreiben.
- [ ] Sichtbaren Namen nicht als Berechtigung auswerten. Autorenzuordnung aus Session beziehungsweise bisherigem serverseitigem Gast-/Eventcheck; Zustandssperre aus FEAT-010 bleibt unabhängig.
- [ ] Bestehende bereits doppelt zugeordnete Vorschläge in der Anzeige weiterhin bevorzugt dem vorhandenen Nutzer zuordnen, wie bisher. Kein ungeprüfter Bestandslauf und keine nachträgliche Stimmenmigration.
- [ ] npx vitest run tests/unit/api/public-proposal-actor.test.ts tests/unit/api/public-event.test.ts grün ausführen. Commit: fix: assign one actor to public BGG proposals.

### Aufgabe 4 – Durchgängigen Identitätsablauf abnehmen

- [ ] E2E in tests/e2e/public_event_identity_test.ts: Gastbeitritt/Stimme, Kontoanmeldung bei vorhandenem Gerätestate, Kontoaktion ohne Doppelbutton, Sessionablauf, erneutes Laden und Kontowechsel.
- [ ] Mit zwei isolierten Identitäten prüfen: bestehende Gaststimmen werden beim Anmelden weder übertragen noch gelöscht. Fremde gespeicherte IDs erlauben keinen zusätzlichen privaten Datenabruf oder Löschen.
- [ ] 390/1440 px, hell/dunkel, 200 % Zoom: lange Spitznamen/Kontonamen, observer/loading/user/guest, gesperrtes Event und fehlgeschlagenes Storage. Identitätsanzeige ohne technische Kontaktdaten verständlich.
- [ ] Impeccable-Kontext/Craft-Floor vor UI-Arbeit, danach gerenderte und manuelle Prüfung. Tastatur-/Screenreaderansage von Identität und Aktionszustand prüfen.
- [ ] npm run test, typecheck, lint, build, security-check und bei geändertem öffentlichen DTO test:ios:contracts ausführen. API-Zusatzfelder/Autorenzuordnung in docs/openapi.yaml dokumentieren.
- [ ] BUG-054 erst nach serverseitiger Regression schließen. BUG-053 bleibt ausdrücklich offen. Backlog, FEATURES, FAQ, CONCEPT, Changelog und Reviewdokumentation aktualisieren.
- [ ] Commit und Review-Regressionscheck; bestehende Hookblocker nicht umgehen.

## 5. Abnahmegrenze

Eine aktive Identität und ein Teilnahmeweg sind über alle Webaktionen konsistent.
Die ausdrücklich gewählte Begrenzung „ohne Gastwechsel“ bleibt erhalten.
Das Feature verbessert keine fehlende Gastbesitzprüfung und darf nicht als
abgesicherte Gastauthentifizierung oder Stimmenzusammenführung dokumentiert werden.
