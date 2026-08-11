# Implementation Plan: Mobile Reihen + Spielefilter

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** iOS-App erhält vollständige Spielereihen-Funktion (inkl. Suche/Filter in Spieleliste); Next.js-Web-App bekommt erweiterte Spielefilter für Spieleranzahl und Komplexität.

**Architecture:**
- Backend: mobile Endpunkte für Series wiederverwenden `SeriesService`; `SyncPayload` und `DashboardDTO` erweitern.
- iOS: neue `LocalGameSeries`/`LocalGameSeriesEntry` SwiftData-Modelle, Netzwerk-Layer, Sync-Engine, Views.
- Web: clientseitige Filtererweiterung in `games-list-client.tsx`.

**Tech Stack:** Next.js 16, Prisma, TypeScript, Tailwind CSS, shadcn/ui, SwiftUI, SwiftData, Alamofire/URLSession (APIClient).

---

## Task 1: Backend – DTO-Mapper und Typen

**Files:**
- Create: `src/lib/dto-mappers/series.ts`
- Modify: `src/lib/dto-mappers/index.ts`
- Modify: `src/lib/sync-types.ts`
- Test: `tests/unit/lib/dto-mappers/series.test.ts`

### Step 1: Series DTO-Mapper

```typescript
import type { GameSeries, GameSeriesEntry } from "@prisma/client";
import type { SeriesDTO, SeriesEntryDTO } from "@/lib/sync-types";

export function toSeriesEntryDto(entry: GameSeriesEntry & { game?: { imageUrl?: string | null } | null }): SeriesEntryDTO {
  return {
    id: entry.id,
    seriesId: entry.seriesId,
    gameId: entry.gameId,
    sortOrder: entry.sortOrder,
    played: entry.played,
    playedAt: entry.playedAt?.toISOString() ?? null,
    rating: entry.rating,
    difficulty: entry.difficulty,
    playTimeMinutes: entry.playTimeMinutes,
    successful: entry.successful,
    playerCount: entry.playerCount,
    score: entry.score,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    game: entry.game ? { imageUrl: entry.game.imageUrl } : undefined,
  };
}

export function toSeriesDto(series: GameSeries & { entries: (GameSeriesEntry & { game?: { imageUrl?: string | null } | null })[] }): SeriesDTO {
  return {
    id: series.id,
    name: series.name,
    description: series.description,
    imageUrl: series.imageUrl,
    ownerId: series.ownerId,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
    deletedAt: series.deletedAt?.toISOString() ?? null,
    entries: series.entries.map(toSeriesEntryDto),
  };
}
```

### Step 2: Re-export in index.ts

```typescript
export { toSeriesDto, toSeriesEntryDto } from "./series";
```

### Step 3: Extend sync-types.ts

```typescript
export interface SeriesEntryDTO {
  id: string;
  seriesId: string;
  gameId: string;
  sortOrder: number;
  played: boolean;
  playedAt: string | null;
  rating: number | null;
  difficulty: string | null;
  playTimeMinutes: number | null;
  successful: boolean | null;
  playerCount: number | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  game?: { imageUrl: string | null };
}

export interface SeriesDTO {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  entries: SeriesEntryDTO[];
}

export interface SyncPayload {
  syncedAt: string;
  games: SyncChanges<GameDTO>;
  sessions: SyncChanges<SessionDTO>;
  events: SyncChanges<EventDTO>;
  groups: SyncChanges<GroupDTO>;
  dateProposals: SyncChanges<DateProposalDTO>;
  groupPolls: SyncChanges<GroupPollDTO>;
  groupComments: SyncChanges<GroupCommentDTO>;
  eventProposals: SyncChanges<EventProposalDTO>;
  votes: SyncChanges<VoteDTO>;
  dateVotes: SyncChanges<DateVoteDTO>;
  groupPollVotes: SyncChanges<GroupPollVoteDTO>;
  groupMembers: SyncChanges<GroupMemberDTO>;
  series: SyncChanges<SeriesDTO>;
}
```

### Step 4: Write test

```typescript
import { describe, it, expect } from "vitest";
import { toSeriesDto } from "@/lib/dto-mappers/series";
import type { GameSeries, GameSeriesEntry } from "@prisma/client";

describe("toSeriesDto", () => {
  it("serializes a series with entries", () => {
    const baseDate = new Date("2026-01-01T12:00:00Z");
    const entry: GameSeriesEntry & { game?: { imageUrl: string | null } } = {
      id: "entry-1", seriesId: "s-1", gameId: "g-1", sortOrder: 0, played: true,
      playedAt: null, rating: 4, difficulty: "fortgeschritten", playTimeMinutes: 60,
      successful: true, playerCount: 3, score: null,
      createdAt: baseDate, updatedAt: baseDate,
      game: { imageUrl: "https://img" },
    } as GameSeriesEntry & { game?: { imageUrl: string | null } };
    const series = {
      id: "s-1", name: "EXIT", description: "Escape", imageUrl: null,
      ownerId: "u-1", createdAt: baseDate, updatedAt: baseDate, deletedAt: null,
      entries: [entry],
    } as GameSeries & { entries: (GameSeriesEntry & { game?: { imageUrl: string | null } })[] };

    const dto = toSeriesDto(series);
    expect(dto.name).toBe("EXIT");
    expect(dto.entries[0].rating).toBe(4);
    expect(dto.entries[0].game?.imageUrl).toBe("https://img");
  });
});
```

---

## Task 2: Backend – Sync-Payload um Reihen erweitern

**Files:**
- Modify: `src/lib/sync-response.ts`
- Test: `tests/unit/app/api/mobile/v1/sync.test.ts`

### Step 1: Query series and entries in buildSyncPayload

Add after group queries:

```typescript
const [series, deletedSeries] = await Promise.all([
  prisma.gameSeries.findMany({
    where: { ownerId: userId, ...NOT_DELETED },
    orderBy: { updatedAt: "desc" },
    include: { entries: { include: { game: { select: { imageUrl: true } } }, orderBy: { sortOrder: "asc" } } },
  }),
  prisma.gameSeries.findMany({
    where: { ownerId: userId, deletedAt: { not: null } },
    select: { id: true },
  }),
]);
```

### Step 2: Add to return object

```typescript
series: toChanges(series.map(toSeriesDto), deletedIdsOnly(deletedSeries)),
```

### Step 3: Update sync test

Verify that `series` is present in `/api/mobile/v1/sync` response and contains `entries`.

---

## Task 3: Backend – mobile Series API Endpunkte

**Files:**
- Create: `src/app/api/mobile/v1/series/route.ts`
- Create: `src/app/api/mobile/v1/series/[id]/route.ts`
- Create: `src/app/api/mobile/v1/series/[id]/entries/route.ts`
- Create: `src/app/api/mobile/v1/series/[id]/entries/[entryId]/route.ts`
- Create: `src/app/api/mobile/v1/series/[id]/entries/reorder/route.ts`
- Test: `tests/unit/app/api/mobile/v1/series/...`

### Step 1: GET/POST /api/mobile/v1/series

```typescript
import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { SeriesService } from "@/lib/services/series.service";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Unauthorized");
    const result = await SeriesService.list(session.user.id);
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Unauthorized");
    const body = await request.json();
    const result = await SeriesService.create(session.user.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
```

### Step 2: GET/PUT/DELETE [id]

```typescript
// src/app/api/mobile/v1/series/[id]/route.ts
export const GET = withApiLogging(async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Unauthorized");
    const { id } = await params;
    const result = await SeriesService.getById(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Unauthorized");
    const { id } = await params;
    const body = await request.json();
    const result = await SeriesService.update(session.user.id, id, body);
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Unauthorized");
    const { id } = await params;
    const result = await SeriesService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
});
```

### Step 3: Entries routes

`[id]/entries/route.ts` POST delegates `SeriesService.addEntry`.  
`[id]/entries/[entryId]/route.ts` PUT/DELETE delegates `updateEntry` / `deleteEntry`.  
`[id]/entries/reorder/route.ts` PUT takes `{ entries: [{ id, sortOrder }] }` and updates each entry with Prisma `$transaction`.

### Step 4: Tests

Write tests for list, create, update, delete, add entry, update entry, delete entry, reorder.

---

## Task 4: Backend – DashboardDTO um Series erweitern

**Files:**
- Modify: `src/app/api/mobile/v1/dashboard/route.ts`
- Modify: `BoardGameTools/BoardGameTools/Networking/DTOs.swift`
- Test: `tests/unit/app/api/mobile/v1/dashboard.test.ts` (if exists; otherwise create)

### Step 1: Add series count

```typescript
const [games, sessions, events, aggregate, seriesCount] = await prisma.$transaction([
  // ... existing counts,
  prisma.gameSeries.count({ where: { ownerId: session.user.id, deletedAt: null } }),
]);

const dto: DashboardDTO = { games, sessions, events, totalDurationMinutes: aggregate._sum.durationMinutes ?? 0, series: seriesCount };
```

### Step 2: Swift DashboardDTO

```swift
struct DashboardDTO: Decodable, Sendable {
    let games: Int
    let sessions: Int
    let events: Int
    let totalDurationMinutes: Int
    let series: Int
}
```

---

## Task 5: Backend – OpenAPI & Changelog

**Files:**
- Modify: `docs/openapi.yaml`
- Modify: `src/lib/changelog.ts`

Add `Series` tag and mobile paths. Add Changelog-Eintrag (Version 0.50.14 oder 0.51.0).

---

## Task 6: iOS – DTOs, Endpoint, RemoteDataSource

**Files:**
- Modify: `BoardGameTools/BoardGameTools/Networking/DTOs.swift`
- Modify: `BoardGameTools/BoardGameTools/Networking/Endpoint.swift`
- Modify: `BoardGameTools/BoardGameTools/Data/RemoteDataSource.swift`

### Step 1: DTOs

```swift
struct SeriesDTO: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var description: String?
    var imageUrl: String?
    var ownerId: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var entries: [SeriesEntryDTO]
}

struct SeriesEntryDTO: Codable, Identifiable, Sendable {
    let id: String
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
    var game: GameDTO?
}

struct SeriesInput: Encodable, Sendable {
    let name: String
    let description: String?
    let imageUrl: String?
}

struct SeriesEntryInput: Encodable, Sendable {
    let gameId: String
    let sortOrder: Int?
}

struct SeriesEntryUpdateInput: Encodable, Sendable {
    let played: Bool?
    let playedAt: String?
    let rating: Int?
    let difficulty: String?
    let playTimeMinutes: Int?
    let successful: Bool?
    let playerCount: Int?
    let score: Int?
}

struct SeriesReorderInput: Encodable, Sendable {
    let entries: [SeriesReorderEntry]
}

struct SeriesReorderEntry: Encodable, Sendable {
    let id: String
    let sortOrder: Int
}
```

### Step 2: Endpoint cases

```swift
case series
case serie(String)
case seriesEntries(String)
case seriesEntry(String, String)
case seriesEntriesReorder(String)
```

Paths: `/api/mobile/v1/series`, `/api/mobile/v1/series/{id}`, `/api/mobile/v1/series/{id}/entries`, `/api/mobile/v1/series/{id}/entries/{entryId}`, `/api/mobile/v1/series/{id}/entries/reorder`.

### Step 3: RemoteDataSource

```swift
func series() async throws -> [SeriesDTO]
func createSeries(_ input: SeriesInput) async throws -> SeriesDTO
func updateSeries(id: String, _ input: SeriesInput) async throws -> SeriesDTO
func deleteSeries(id: String) async throws
func addSeriesEntry(seriesId: String, gameId: String) async throws -> SeriesEntryDTO
func updateSeriesEntry(seriesId: String, entryId: String, _ input: SeriesEntryUpdateInput) async throws -> SeriesEntryDTO
func deleteSeriesEntry(seriesId: String, entryId: String) async throws
func reorderSeriesEntries(seriesId: String, _ input: SeriesReorderInput) async throws
```

---

## Task 7: iOS – SwiftData Modelle und LocalDataSource

**Files:**
- Create: `BoardGameTools/BoardGameTools/Models/LocalGameSeries.swift`
- Create: `BoardGameTools/BoardGameTools/Models/LocalGameSeriesEntry.swift`
- Modify: `BoardGameTools/BoardGameTools/Data/LocalDataSource.swift`
- Modify: `BoardGameTools/BoardGameTools/Services/SyncEngine.swift`

### Step 1: LocalGameSeries

```swift
import Foundation
import SwiftData

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

### Step 2: LocalGameSeriesEntry

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

### Step 3: LocalDataSource

```swift
func upsertSeries(_ dto: SeriesDTO) throws
func deleteSeries(id: String) throws
func fetchSeries() throws -> [LocalGameSeries]
```

### Step 4: SyncEngine

```swift
for dto in payload.series.created + payload.series.updated {
    try local.upsertSeries(dto)
}
for id in payload.series.deleted {
    try local.deleteSeries(id: id)
}
```

---

## Task 8: iOS – Spieleliste mit Suche und Filter

**Files:**
- Modify: `BoardGameTools/BoardGameTools/Views/GameListView.swift`
- Create: `BoardGameTools/BoardGameTools/Views/GameFilterSheet.swift`

### Step 1: GameListView

- Add `@State private var searchText = ""`
- Add `@State private var isShowingFilterSheet = false`
- Add `@State private var selectedTags: Set<String> = []`
- Add `@State private var selectedPlayerCount: Int?`
- Add `@State private var minComplexity: Int?`
- Add `@State private var sortOption: GameSortOption = .nameAsc`
- Apply `.searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always))`
- Toolbar filter button
- Filter logic:

```swift
var filteredGames: [LocalGame] {
    localGames.filter { game in
        let matchesSearch = searchText.isEmpty || game.name.localizedStandardContains(searchText)
        let matchesTags = selectedTags.isEmpty || !Set(game.tagNames).isDisjoint(with: selectedTags)
        let matchesPlayers = selectedPlayerCount == nil || (game.minPlayers <= selectedPlayerCount! && game.maxPlayers >= selectedPlayerCount!)
        let matchesComplexity = minComplexity == nil || (game.complexity ?? 0) >= minComplexity!
        return matchesSearch && matchesTags && matchesPlayers && matchesComplexity
    }.sorted { lhs, rhs in
        switch sortOption {
        case .nameAsc: return lhs.name.localizedStandardCompare(rhs.name) == .orderedAscending
        case .nameDesc: return lhs.name.localizedStandardCompare(rhs.name) == .orderedDescending
        case .complexityAsc: return (lhs.complexity ?? 0) < (rhs.complexity ?? 0)
        case .complexityDesc: return (lhs.complexity ?? 0) > (rhs.complexity ?? 0)
        case .playersAsc: return lhs.minPlayers < rhs.minPlayers
        case .playersDesc: return lhs.minPlayers > rhs.minPlayers
        case .newest: return lhs.createdAt > rhs.createdAt
        }
    }
}
```

### Step 2: GameFilterSheet

- Tags as horizontal chips
- Player count Picker (1-12, nil = all)
- Complexity star picker (1-5, nil = all)
- Sort Picker
- Reset / Apply buttons

---

## Task 9: iOS – Reihen-UI

**Files:**
- Create: `BoardGameTools/BoardGameTools/Views/SeriesListView.swift`
- Create: `BoardGameTools/BoardGameTools/Views/SeriesDetailView.swift`
- Create: `BoardGameTools/BoardGameTools/Views/SeriesEditView.swift`
- Create: `BoardGameTools/BoardGameTools/Views/AddSeriesEntrySheet.swift`
- Modify: `BoardGameTools/BoardGameTools/Views/MainTabView.swift`

### Step 1: SeriesListView

- `@Query(sort: \LocalGameSeries.name) var localSeries: [LocalGameSeries]`
- `.searchable`, Toolbar add button
- Card rows with progress
- Navigation to `SeriesDetailView`

### Step 2: SeriesDetailView

- Header: cover, name, description, progress bar
- List of entries sorted by `sortOrder`
- Each row: cover, name, difficulty, status, rating
- Swipe delete, mark played, edit rating
- Toolbar: add entry, edit series

### Step 3: SeriesEditView

- Form with name, description, imageUrl
- Save triggers `RemoteDataSource.createSeries` or `updateSeries`
- Then `syncEngine.sync()`

### Step 4: AddSeriesEntrySheet

- Searchable list of `LocalGame`
- Select a game, call `RemoteDataSource.addSeriesEntry`
- Then `syncEngine.sync()` and dismiss

### Step 5: MainTabView

```swift
SeriesListView()
    .tabItem { Label("Reihen", systemImage: "rectangle.stack.badge.play") }
```

---

## Task 10: Web – Spielefilter erweitern

**Files:**
- Modify: `src/app/(dashboard)/dashboard/games/games-list-client.tsx`
- Create: `src/app/(dashboard)/dashboard/games/games-filter-sheet.tsx` (optional)

### Step 1: Add filter states

```typescript
const [playerCount, setPlayerCount] = useState<number | null>(null);
const [minComplexity, setMinComplexity] = useState<number | null>(null);
const [sortOption, setSortOption] = useState<SortOption>("name_asc");
```

### Step 2: Filter logic

```typescript
const filteredGames = useMemo(() => {
  let result = games.filter((g) => {
    const matchesSearch = !searchText || g.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesTag = !activeTag || (g.tags ?? []).some((t) => t.tag.id === activeTag);
    const matchesPlayers = playerCount == null || (g.minPlayers <= playerCount && g.maxPlayers >= playerCount);
    const matchesComplexity = minComplexity == null || (g.complexity ?? 0) >= minComplexity;
    return matchesSearch && matchesTag && matchesPlayers && matchesComplexity;
  });
  result.sort((a, b) => { … });
  return result;
}, [games, searchText, activeTag, playerCount, minComplexity, sortOption]);
```

### Step 3: UI controls

- Add Popover/Sheet trigger with Filter icon
- Inside: player count slider/select, star buttons for min complexity, sort select
- Show active filter count badge

---

## Task 11: Tests und Verifikation

**Files:**
- Test: `tests/unit/lib/dto-mappers/series.test.ts`
- Test: `tests/unit/app/api/mobile/v1/series/route.test.ts`
- Test: `tests/unit/app/api/mobile/v1/sync.test.ts` update
- Test: `tests/unit/app/api/mobile/v1/dashboard.test.ts` update

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run review-evaluate:regression
```

iOS build from Xcode or `xcodebuild` if available.

---

## Task 12: Dokumentation

**Files:**
- Modify: `src/lib/changelog.ts`
- Modify: `docs/FEATURES.md`
- Modify: `docs/openapi.yaml`
- Modify: `src/lib/faq.ts` (optional)

Add Changelog-Eintrag, OpenAPI paths, Feature-Dokumentation.

---

## Self-Review

- Spec coverage: all sections mapped to tasks ✅
- No placeholders/TODOs ✅
- Type consistency: `SeriesDTO`, `SeriesEntryDTO`, `LocalGameSeries`, `LocalGameSeriesEntry` aligned ✅
- Tests included for backend changes ✅
