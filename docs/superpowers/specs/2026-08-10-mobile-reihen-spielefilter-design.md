# Design: Spielereihen + Spielefilter für iOS und Web

**Datum:** 2026-08-10  
**Version:** 1.0  
**Status:** Genehmigt  

## 1. Ziel

Die iOS-App (`BoardGameTools`) erhält ein vollständiges **Spielereihen-Feature** (analog zur Web-App) sowie eine **durchsuch- und filterbare Spieleliste**.  
Die Next.js-Web-App bekommt in der Spieleliste zusätzliche Filter für **Spieleranzahl** und **Komplexität** sowie eine **Sortierung**.

## 2. Scope

### In Scope

- Backend: neue mobile API-Endpunkte für Spielereihen
- Backend: Erweiterung von `SyncPayload` und `DashboardDTO`
- iOS: SwiftData-Modelle für Reihen und Einträge
- iOS: Netzwerk-Layer, Sync-Engine und LocalDataSource für Reihen
- iOS: UI für Spieleliste (Suche, Filter, Sortierung)
- iOS: UI für Reihen (Liste, Detail, Bearbeiten, Einträge verwalten)
- iOS: Berücksichtigung der `mobile-ios-design`-Guidelines (SF Symbols, semantische Farben, Dynamic Type, Accessibility)
- Web: Erweiterung der Spieleliste um Spieleranzahl-, Komplexitäts-Filter und Sortierung
- Dokumentation: Changelog, OpenAPI, ggf. FAQ/FEATURES
- Tests: Unit-Tests für Backend-Routes und DTO-Mapper

### Out of Scope

- Offline-First-Schreib-Queue (Änderungen werden sofort ans Backend gesendet, wie im Rest der iOS-App)
- Push-Notifications für Reihen-Fortschritt
- BGG-Import direkt in eine Reihe (Spiele müssen zuerst der Sammlung hinzugefügt werden)

## 3. Backend

### 3.1 Neue mobile Endpunkte

Alle Endpunkte liegen unter `/api/mobile/v1` und nutzen `apiAuth` (Bearer-Token oder Web-Session), um iOS und Web-Auth zu unterstützen.

| Methode | Pfad | Zweck |
|---------|------|-------|
| `GET` | `/api/mobile/v1/series` | Alle Reihen des Nutzers inkl. Entry-Count und Fortschritt |
| `POST` | `/api/mobile/v1/series` | Neue Reihe anlegen |
| `GET` | `/api/mobile/v1/series/:id` | Einzelne Reihe inkl. aller Entries |
| `PUT` | `/api/mobile/v1/series/:id` | Reihe bearbeiten |
| `DELETE` | `/api/mobile/v1/series/:id` | Reihe soft-löschen |
| `POST` | `/api/mobile/v1/series/:id/entries` | Spiel zur Reihe hinzufügen |
| `PUT` | `/api/mobile/v1/series/:id/entries/:entryId` | Entry aktualisieren (gespielt, Bewertung, etc.) |
| `DELETE` | `/api/mobile/v1/series/:id/entries/:entryId` | Entry aus Reihe entfernen |
| `PUT` | `/api/mobile/v1/series/:id/entries/reorder` | Reihenfolge der Entries ändern |

Implementierung: Jeder Endpunkt delegiert an das existierende `SeriesService` (`src/lib/services/series.service.ts`).  
Fehlerformat bleibt `{ error: string }`.

### 3.2 Sync-Payload

`src/lib/sync-response.ts` und `src/lib/sync-types.ts` werden um ein Feld `series` erweitert:

```typescript
interface SyncPayload {
  // ... bestehende Felder
  series: SyncChanges<SeriesDTO>;
}
```

`SeriesDTO` enthält die `entries` verschachtelt:

```typescript
interface SeriesDTO {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  entries: SeriesEntryDTO[];
}

interface SeriesEntryDTO {
  id: string;
  seriesId: string;
  gameId: string;
  sortOrder: number;
  played: boolean;
  playedAt?: string | null;
  rating?: number | null;
  difficulty?: string | null;
  playTimeMinutes?: number | null;
  successful?: boolean | null;
  playerCount?: number | null;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
}
```

`buildSyncPayload` fragt `prisma.gameSeries` und `prisma.gameSeriesEntry` mit `ownerId` ab und serialisiert über `toSeriesDto` / `toSeriesEntryDto`.

### 3.3 DashboardDTO

Optional wird `DashboardDTO` um `series: number` erweitert, damit iOS-Dashboard und Web-Dashboard konsistent zählen.  
Falls der Aufwand zu groß ist, wird der Count aus der Sync-Datenmenge abgeleitet.

## 4. iOS Datenmodell (SwiftData)

### 4.1 `LocalGameSeries`

```swift
@Model
final class LocalGameSeries {
    @Attribute(.unique) var id: String
    var name: String
    var desc: String?
    var imageUrl: String?
    var ownerId: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var syncState: String

    @Relationship(deleteRule: .cascade)
    var entries: [LocalGameSeriesEntry]?

    init(dto: SeriesDTO) { … }
    func update(from dto: SeriesDTO) { … }
    func toDTO() -> SeriesDTO { … }
}
```

### 4.2 `LocalGameSeriesEntry`

```swift
@Model
final class LocalGameSeriesEntry {
    @Attribute(.unique) var id: String
    var seriesId: String
    var gameId: String
    var sortOrder: Int
    var played: Bool
    var playedAt: String?
    var rating: Int?
    var difficulty: String?
    var playTimeMinutes: Int?
    var successful: Bool?
    var playerCount: Int?
    var score: Int?
    var createdAt: String
    var updatedAt: String

    @Relationship(deleteRule: .nullify)
    var game: LocalGame?

    init(dto: SeriesEntryDTO) { … }
    func update(from dto: SeriesEntryDTO) { … }
}
```

### 4.3 DTOs und Netzwerk

`DTOs.swift` wird um `SeriesDTO`, `SeriesEntryDTO`, `SeriesInput`, `SeriesEntryInput`, `SeriesReorderInput` ergänzt.  
`Endpoint.swift` erhält die neuen Fälle.  
`RemoteDataSource` bekommt passende `series*`-Methoden.  
`SyncEngine.apply` verarbeitet `payload.series` und delegiert an `LocalDataSource`.

## 5. iOS UI

### 5.1 Spieleliste (`GameListView`)

- **Suchleiste**: `.searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always))`
- **Toolbar-Button** rechts: Filter-Sheet öffnen (`line.3.horizontal.decrease.circle`)
- **Filter-Sheet** (`GameFilterSheet`):
  - Tags als horizontale Chips
  - Spieleranzahl: `Picker` „Genau X Spieler“ (1–12)
  - Komplexität: Sterne-Picker 1–5 („mindestens X Sterne“)
- **Sortierung**: Toolbar-Button oder Menü mit Optionen
  - Name A–Z / Z–A
  - Komplexität auf-/absteigend
  - Spieleranzahl auf-/absteigend
  - Zuletzt hinzugefügt
- **Filter-Logik**: clientseitig in `GameListView` mit `searchText`, `selectedTags`, `selectedPlayerCount`, `selectedMinComplexity`

Filterregeln (Spieleranzahl): `game.minPlayers <= selectedPlayerCount && game.maxPlayers >= selectedPlayerCount`.  
Filterregeln (Komplexität): `game.complexity >= selectedMinComplexity`.

### 5.2 Reihen-Tab (`SeriesListView`)

- Neuer Tab in `MainTabView` mit Label „Reihen“ und Icon `rectangle.stack.badge.play`
- `.searchable` für Reihennamen/Beschreibung
- Sortierung: Name, Fortschritt, Anzahl Einträge, Neueste/Älteste
- Liste zeigt pro Reihe:
  - Cover/Platzhalter
  - Name + Beschreibung (2 Zeilen)
  - Fortschrittsanzeige (`played / total` als Text + visueller Balken)
  - Chevron rechts
- Toolbar-Button „Neue Reihe“
- Leerzustand: `EmptyStateView(icon: "rectangle.stack", title: "Noch keine Reihen", subtitle: "Erstelle eine Reihe für EXIT, Adventure Games oder ähnliche Serien.")`

### 5.3 Reihen-Detail (`SeriesDetailView`)

- Header mit Reihen-Cover, Name, Beschreibung
- ProgressBar mit `played / total`
- Liste aller `entries` sortiert nach `sortOrder`
- Pro Entry:
  - Spielcover
  - Spielname
  - Schwierigkeit (optional)
  - Status: offen / gespielt
  - Bewertung: 1–5 Sterne
  - Button „Gespielt markieren“ (toggelt `played` + setzt `playedAt`)
- Swipe-to-delete für Entry
- Toolbar-Button „Spiel hinzufügen“ öffnet `AddSeriesEntrySheet`
- Toolbar-Button „Bearbeiten“ öffnet `SeriesEditView`

### 5.4 Reihe bearbeiten / anlegen (`SeriesEditView`)

- Formularfelder: Name (verpflichtend), Beschreibung, Bild-URL
- Speichern/Abbrechen
- Bei Neuanlage wird ans Backend `POST /api/mobile/v1/series` gesendet, danach `syncEngine.sync()`

### 5.5 Spiel zur Reihe hinzufügen (`AddSeriesEntrySheet`)

- Suchbares Sheet mit lokaler Spieleliste
- Tipp auf Spiel fügt es als Entry hinzu (`POST …/entries`)
- Danach `syncEngine.sync()`

### 5.6 UI-Design-Prinzipien (mobile-ios-design)

- Semantische Farben: `.primary`, `.secondary`, `.background`, `.tertiary`
- SF Symbols für alle Icons
- Dynamische Schriftarten: `.largeTitle`, `.headline`, `.body`, `.caption`
- Karten mit abgerundeten Ecken (`cornerRadius: 12`) und dezentem Schatten
- Accessibility-Labels und -Hints auf allen Buttons, Stars und Toggle-Elementen
- LazyVStack/LazyHStack für lange Listen
- Safe Areas und `.presentationDetents` für Sheets respektieren
- Keine hartkodierten Farbwerte

## 6. Web Spieleliste

- Bestehende Textsuche und Tag-Filter bleiben erhalten.
- Neuer kombinierter **Filter-Button** in der Toolbar öffnet ein `Popover`/`Sheet`.
- Filter:
  - **Spieleranzahl**: „Für X Spieler“ (1–12), filtert `minPlayers <= X <= maxPlayers`
  - **Komplexität**: Sterne-Buttons 1–5, filtert `complexity >= X`
- Sortierung:
  - Name A–Z / Z–A
  - Komplexität auf-/absteigend
  - Spieleranzahl auf-/absteigend
  - Zuletzt hinzugefügt
- Alles clientseitig in `games-list-client.tsx`.

## 7. Tests

- Unit-Tests für neue mobile Endpunkte unter `tests/unit/app/api/mobile/v1/series/...`
- Unit-Tests für `toSeriesDto` / `toSeriesEntryDto`
- Unit-Tests für `buildSyncPayload` Erweiterung
- `BoardGameToolsTests` bei Bedarf um DTO-Codierung erweitern
- `npm run review-evaluate:regression` nach Abschluss

## 8. Dokumentation

- `src/lib/changelog.ts`: neuer Eintrag für die Version
- `docs/openapi.yaml`: mobile Series-Endpunkte dokumentieren
- `docs/FEATURES.md`: iOS-Reihen-Feature und erweiterte Filter ergänzen
- `src/lib/faq.ts`: ggf. Eintrag „Wie filtere ich Spiele?“ / „Was sind Reihen?"

## 9. Annahmen und offene Punkte

- Spieleranzahl-Filter filtert exakt auf „passt für X Spieler“, nicht auf Bereiche.
- Komplexitäts-Filter filtert „mindestens X Sterne“.
- Reihen in iOS nutzen denselben Soft-Delete-Mechanismus wie die Web-App.
- Reihenbilder werden als URL gespeichert; Upload ist nicht Teil dieses Features.
- `DashboardDTO` wird nur um `series` erweitert, wenn die Änderung in der iOS-App sichtbar sein soll.
