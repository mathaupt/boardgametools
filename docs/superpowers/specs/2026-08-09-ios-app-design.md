# BoardGameTools — Native iOS-App Design-Spec

> **Version:** 1.0  
> **Datum:** 2026-08-09  
> **Status:** Genehmigt zur Implementierung  
> **Zugehöriges Projekt:** BoardGameTools Next.js Web-App (`CONCEPT.md`, `docs/FEATURES.md`)

---

## 1. Ziel

Eine native iOS-Companion-App für BoardGameTools, die den Großteil der Web-Funktionen (Spielesammlung, Sessions, Events, Gruppen, Abstimmungen) offline-fähig und mit nativem iOS-UX bereitstellt. Die Geschäftslogik bleibt in der bestehenden Next.js-Anwendung; die iOS-App nutzt eine neue, versionierte REST-API (`/api/mobile/v1/*`) und wiederverwendet die bestehende Service-Schicht in `src/lib/services/`.

---

## 2. Kontext

- **Web-Backend:** Next.js 16.3.0, NextAuth v5 (Credentials), Prisma 7.9.1, PostgreSQL.
- **Serviceschicht:** Vorhanden in `src/lib/services/index.ts` (`GameService`, `SessionService`, `EventService`, `GroupService`, `SeriesService`, `TagService`). Diese Services kapseln die gesamte Datenbank- und Geschäftslogik.
- **Auth:** Aktuell Cookie-basierte JWT-Session über NextAuth. Natives iOS benötigt einen `Authorization: Bearer <token>` Header.
- **Öffentliche Links:** Bereits als `/api/public/event/[token]`, `/api/public/group/[token]`, `/api/public/invite/[token]/respond` implementiert.
- **Rate-Limiting:** Vorhanden über `@upstash/ratelimit` (`src/lib/rate-limit.ts`).

---

## 3. Nicht-Ziele

- Kein vollständiger Rewrite der Web-App.
- Keine eigene iOS-Backend-Logik; alle Domänenregeln bleiben im Next.js-Backend.
- Keine Echtzeit-Kollaboration (WebSockets) in Phase 1.
- Keine Wearable- oder iPad-spezifischen Features in Phase 1.
- Kein Barcode-Lookup ohne Backend-Route (BGG-Suche und Import bleiben serverseitig).

---

## 4. Architektur-Überblick

```
┌─────────────────────────────────────┐
│  iOS-App (SwiftUI + SwiftData)      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   SwiftUI    │  │  SyncEngine  │ │
│  │    Views     │  │  (Push/Pull) │ │
│  └──────┬───────┘  └──────┬───────┘ │
│         │                 │         │
│  ┌──────┴───────┐  ┌──────┴──────┐ │
│  │  ViewModels  │  │ Repositories│ │
│  │ (@Observable)│  │             │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                 │         │
│  ┌──────┴────────────────┴──────┐  │
│  │      APIClient + AuthManager │  │
│  │   (URLSession, Keychain)   │  │
│  └──────────────┬───────────────┘  │
└─────────────────┼─────────────────┘
                  │ HTTPS / JSON
┌─────────────────┼─────────────────┐
│  Next.js Backend│                 │
│  ┌──────────────┴──────────────┐ │
│  │   /api/mobile/v1/* Routes   │ │
│  │   -> src/lib/services/*     │ │
│  └─────────────────────────────┘ │
└───────────────────────────────────┘
```

---

## 5. Backend-Erweiterungen

### 5.1 API-Token-Authentifizierung

Neues Prisma-Modell in `prisma/schema.prisma`:

```prisma
model ApiToken {
  id          String    @id @default(cuid())
  userId      String
  name        String    @default("iOS App")
  tokenHash   String    @unique
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}
```

Im `User`-Modell wird die Gegenrelation ergänzt: `apiTokens ApiToken[]`.

**Sicherheitshinweis:** Der Klartext-Token wird nur einmalig generiert und ausgegeben. In der Datenbank wird ausschließlich `tokenHash` (SHA-256) gespeichert.

**Token-Lebenszyklus:**
- Bei Login mit E-Mail/Passwort oder Sign in with Apple wird ein **Access-Token** (24h) und ein **Refresh-Token** (30 Tage) erstellt.
- Tokens werden als SHA-256-Hash gespeichert; nur der Klartext-Token wird einmalig an den Client übergeben.
- Refresh-Endpoint rotiert beide Tokens und widerruft den alten Refresh-Token.
- iOS speichert Tokens im **Keychain** (`kSecClassGenericPassword`, accessible `afterFirstUnlock`).

**Neue Endpunkte:**
- `POST /api/mobile/v1/auth/login` → `{ email, password }` → `{ accessToken, refreshToken, expiresAt }`
- `POST /api/mobile/v1/auth/refresh` → `{ refreshToken }` → `{ accessToken, refreshToken }`
- `POST /api/mobile/v1/auth/logout` → widerruft Refresh-Token
- `POST /api/mobile/v1/auth/logout-all` → widerruft alle Tokens des Nutzers

### 5.2 Sign in with Apple

- `AppleProvider` in `src/lib/auth.ts` ergänzen.
- iOS nutzt `AuthenticationServices` (`ASAuthorizationController`) und sendet `identityToken` + `authorizationCode` an:
  - `POST /api/auth/callback/apple` (NextAuth-Callback) oder
  - dedizierter Mobile-Callback `POST /api/mobile/v1/auth/apple`.
- Backend validiert das JWT gegen Apples Public Keys, erstellt/verknüpft den User und gibt API-Tokens zurück.
- Apples `Name`-Feld wird beim ersten Login übernommen.

### 5.3 Auth-Helfer für API-Routen

Neue Datei `src/lib/api-auth.ts`:

```typescript
export async function apiAuth(request: NextRequest): Promise<Session | null> {
  // 1. Versuche NextAuth-Session über Cookie (bestehendes Web-Verhalten)
  const webSession = await auth();
  if (webSession?.user?.id) return webSession;

  // 2. Versuche Bearer-Token aus Authorization-Header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const tokenHash = hashToken(token); // SHA-256
  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: { select: SAFE_USER_SELECT } },
  });

  if (!apiToken || apiToken.revokedAt || (apiToken.expiresAt && apiToken.expiresAt < new Date())) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: {
      id: apiToken.user.id,
      email: apiToken.user.email,
      name: apiToken.user.name,
      role: apiToken.user.role,
    },
  };
}
```

Bestehende Web-Routen behalten `auth()` bei; neue `/api/mobile/v1/*` Routen verwenden `apiAuth()`. So bleibt das Web-Verhalten unverändert.

### 5.4 CSRF und Proxy

- `src/proxy.ts` prüft vor der CSRF-Validierung: Ist ein gültiger `Authorization: Bearer` Header vorhanden? Falls ja, CSRF-Prüfung überspringen.
- Bei reinen Browser-Requests ohne Bearer-Token läuft die bestehende CSRF-Logik weiter.

### 5.5 Mobile API-Namespace `/api/mobile/v1/`

Neuer Ordner `src/app/api/mobile/v1/` mit eigenen Route Handlern. Diese sind **dünn** und delegieren an `src/lib/services/*`.

**Endpunkte (Auswahl):**

| Methode | Pfad | Zweck |
|---------|------|-------|
| GET | `/api/mobile/v1/me` | Aktueller Nutzer |
| GET | `/api/mobile/v1/dashboard` | Statistik-Kacheln |
| GET | `/api/mobile/v1/games` | Spiele-Liste (paginiert) |
| POST | `/api/mobile/v1/games` | Spiel anlegen |
| GET/PUT/DELETE | `/api/mobile/v1/games/[id]` | Spiel Detail/Update/Löschen |
| GET | `/api/mobile/v1/games/[id]/sessions` | Letzte Sessions zu einem Spiel |
| GET | `/api/mobile/v1/bgg/search?q=<String>` | BGG-Suche |
| POST | `/api/mobile/v1/bgg/import` | Spiel aus BGG importieren |
| POST | `/api/mobile/v1/bgg/lookup` | Barcode/EAN → BGG |
| GET | `/api/mobile/v1/sessions` | Sessions-Liste |
| POST | `/api/mobile/v1/sessions` | Session anlegen |
| GET/PUT/DELETE | `/api/mobile/v1/sessions/[id]` | Session Detail/Update/Löschen |
| GET | `/api/mobile/v1/events` | Events-Liste |
| POST | `/api/mobile/v1/events` | Event anlegen |
| GET | `/api/mobile/v1/events/[id]` | Event inkl. Vorschläge und Terminvorschläge |
| POST | `/api/mobile/v1/events/[id]/proposals` | Spiel vorschlagen |
| POST | `/api/mobile/v1/events/[id]/votes` | Für Spiel abstimmen |
| POST | `/api/mobile/v1/events/[id]/date-votes` | Termin abstimmen |
| GET | `/api/mobile/v1/groups` | Gruppen-Liste |
| POST | `/api/mobile/v1/groups` | Gruppe anlegen |
| GET | `/api/mobile/v1/groups/[id]` | Gruppendetails |
| POST | `/api/mobile/v1/groups/[id]/join` | Gruppe beitreten (Share-Token) |
| GET/POST | `/api/mobile/v1/groups/[id]/polls` | Umfragen |
| POST | `/api/mobile/v1/groups/[id]/comments` | Kommentar schreiben |
| GET | `/api/mobile/v1/sync?since=<ISO8601>` | Synchronisations-Endpoint |
| POST | `/api/mobile/v1/uploads` | Bild-Upload |
| GET | `/api/mobile/v1/public/event/[token]` | Gast-Event-Details |
| POST | `/api/mobile/v1/public/event/[token]/vote` | Gast-Voting |
| POST | `/api/mobile/v1/public/event/[token]/join` | Gast beitritt |
| POST | `/api/mobile/v1/devices` | Push-Device-Token registrieren |

### 5.6 Synchronisations-Endpoint

`GET /api/mobile/v1/sync?since=2026-08-09T12:00:00Z`

Liefert Änderungen seit dem letzten Sync für alle relevanten Entitäten:

```json
{
  "syncedAt": "2026-08-09T14:30:00Z",
  "games": {
    "created": [ { "id": "cuid-1", "name": "Azul", "minPlayers": 2, "maxPlayers": 4 } ],
    "updated": [ { "id": "cuid-2", "name": "Carcassonne aktualisiert" } ],
    "deleted": [ "cuid-3" ]
  },
  "sessions": { "created": [], "updated": [], "deleted": [] },
  "events": { "created": [], "updated": [], "deleted": [] },
  "groups": { "created": [], "updated": [], "deleted": [] },
  "groupPolls": { "created": [], "updated": [], "deleted": [] },
  "eventProposals": { "created": [], "updated": [], "deleted": [] },
  "votes": { "created": [], "updated": [], "deleted": [] },
  "dateVotes": { "created": [], "updated": [], "deleted": [] }
}
```

Jedes Feld enthält `created` (neue Records), `updated` (geänderte Records) und `deleted` (Array von IDs). Soft-Deletes erscheinen als `deleted` Einträge; der Client entfernt diese IDs aus SwiftData.

### 5.7 Push-Benachrichtigungen

Neues Prisma-Modell:

```prisma
model PushDevice {
  id          String    @id @default(cuid())
  userId      String
  deviceToken String
  platform    String    @default("ios")
  appVersion  String?
  locale      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceToken])
  @@index([userId])
}
```

Im `User`-Modell wird die Gegenrelation ergänzt: `pushDevices PushDevice[]`.

- iOS registriert APNs-Token beim App-Start und sendet ihn an `POST /api/mobile/v1/devices`.
- Backend speichert Token pro User.
- Trigger für Push: Event-Einladung angenommen, Event kurz bevor es stattfindet, Abstimmungs-Ende, Erinnerung.
- Versand: APNs HTTP/2 API (z.B. über `node-apn`) oder ein Hosted-Service wie OneSignal/Expo Push im ersten Schritt.

---

## 6. iOS-App-Architektur

### 6.1 Tech-Stack

- **Sprache:** Swift 6
- **UI:** SwiftUI mit `@Observable` (iOS 17+)
- **Architekturmuster:** MVVM + Clean Architecture-Light (Repositories + Use Cases optional)
- **Lokale Datenbank:** SwiftData (`@Model`)
- **Netzwerk:** `URLSession` + eigener `APIClient`
- **Auth-Storage:** Keychain (Swift-Wrapper `KeychainAccess` oder eigener Wrapper)
- **Bilder:** `AsyncImage` / `Kingfisher` für Caching
- **Barcode:** `AVCaptureMetadataOutput`
- **OCR:** `Vision` (`VNRecognizeTextRequest`)
- **Push:** `UserNotifications` + APNs
- **Sign in with Apple:** `AuthenticationServices`
- **Deep Links:** `onOpenURL` + Associated Domains (Universal Links)

### 6.2 Schichten

```
Presentation Layer
├─ Views (SwiftUI)
└─ ViewModels (@Observable)

Domain Layer
├─ UseCases (optional, für komplexe Abläufe wie Sync)
└─ Models (SwiftData @Model)

Data Layer
├─ Repositories (GameRepository, SessionRepository, EventRepository, GroupRepository, SeriesRepository)
├─ LocalDataSource (SwiftData)
├─ RemoteDataSource (APIClient)
└─ SyncEngine

Infrastructure Layer
├─ APIClient (URLSession, Auth, Retry, Token-Refresh)
├─ AuthManager (Keychain, Token-Refresh)
├─ KeychainManager
└─ NotificationManager
```

### 6.3 SwiftData-Modelle

Nur eine **Teilmenge** der Prisma-Entitäten wird lokal gespiegelt. Jedes Modell hat ein `syncState`-Feld.

```swift
import SwiftData

@Model
final class LocalGame {
    @Attribute(.unique) var id: String
    var name: String
    var gameDescription: String?
    var minPlayers: Int
    var maxPlayers: Int
    var playTimeMinutes: Int?
    var complexity: Int?
    var bggId: String?
    var ean: String?
    var imageUrl: String?
    var updatedAt: Date
    var syncState: SyncState
    @Relationship(inverse: \LocalSession.game) var sessions: [LocalSession]?
    @Relationship(inverse: \LocalGameTag.game) var tags: [LocalGameTag]?

    init(
        id: String,
        name: String,
        gameDescription: String? = nil,
        minPlayers: Int = 1,
        maxPlayers: Int = 4,
        playTimeMinutes: Int? = nil,
        complexity: Int? = nil,
        bggId: String? = nil,
        ean: String? = nil,
        imageUrl: String? = nil,
        updatedAt: Date,
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.name = name
        self.gameDescription = gameDescription
        self.minPlayers = minPlayers
        self.maxPlayers = maxPlayers
        self.playTimeMinutes = playTimeMinutes
        self.complexity = complexity
        self.bggId = bggId
        self.ean = ean
        self.imageUrl = imageUrl
        self.updatedAt = updatedAt
        self.syncState = syncState
    }
}

enum SyncState: String, Codable {
    case synced
    case pendingCreate
    case pendingUpdate
    case pendingDelete
}
```

Weitere Modelle: `LocalSession`, `LocalSessionPlayer`, `LocalEvent`, `LocalEventProposal`, `LocalVote`, `LocalDateVote`, `LocalGroup`, `LocalGroupMember`, `LocalGroupPoll`, `LocalGroupPollOption`, `LocalGroupPollVote`, `LocalGroupComment`, `LocalUser`, `LocalTag`, `LocalGameTag`.

### 6.4 APIClient

```swift
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint, body: Encodable?) async throws -> T
    func request(_ endpoint: Endpoint, body: Encodable?) async throws -> Data
}

actor APIClient {
    private let baseURL: URL
    private let session: URLSession
    private let authManager: AuthManager

    func request<T: Decodable>(
        _ endpoint: Endpoint,
        method: HTTPMethod,
        body: Encodable? = nil
    ) async throws -> T {
        var request = try endpoint.urlRequest(baseURL: baseURL, method: method)
        if let token = await authManager.accessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        try validate(response, data: data)
        return try JSONDecoder.iso8601.decode(T.self, from: data)
    }
}
```

**Endpoint-Enum:**

```swift
enum Endpoint {
    case login
    case refresh
    case logout
    case me
    case dashboard
    case games(page: Int, limit: Int)
    case gameDetail(id: String)
    case createGame
    case updateGame(id: String)
    case deleteGame(id: String)
    case sessions(page: Int, limit: Int)
    case createSession
    case sessionDetail(id: String)
    case updateSession(id: String)
    case deleteSession(id: String)
    case events(page: Int, limit: Int)
    case eventDetail(id: String)
    case createEvent
    case voteEvent(id: String)
    case dateVoteEvent(id: String)
    case groups(page: Int, limit: Int)
    case groupDetail(id: String)
    case createGroup
    case joinGroup(id: String)
    case sync(since: Date?)
    case uploadImage

    var path: String {
        switch self {
        case .login: return "/auth/login"
        case .refresh: return "/auth/refresh"
        case .logout: return "/auth/logout"
        case .me: return "/me"
        case .dashboard: return "/dashboard"
        case .games: return "/games"
        case .gameDetail(let id), .updateGame(let id), .deleteGame(let id):
            return "/games/\(id)"
        case .sessions: return "/sessions"
        case .createSession: return "/sessions"
        case .updateSession(let id), .deleteSession(let id), .sessionDetail(let id):
            return "/sessions/\(id)"
        case .events: return "/events"
        case .createEvent: return "/events"
        case .eventDetail(let id): return "/events/\(id)"
        case .voteEvent(let id): return "/events/\(id)/votes"
        case .dateVoteEvent(let id): return "/events/\(id)/date-votes"
        case .groups: return "/groups"
        case .createGroup: return "/groups"
        case .groupDetail(let id), .joinGroup(let id): return "/groups/\(id)"
        case .sync: return "/sync"
        case .uploadImage: return "/uploads"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .login, .refresh, .logout, .createGame, .createSession, .createEvent, .voteEvent, .dateVoteEvent, .joinGroup, .uploadImage:
            return .post
        case .updateGame, .updateSession:
            return .put
        case .deleteGame, .deleteSession:
            return .delete
        default:
            return .get
        }
    }
}
```

### 6.5 AuthManager

```swift
@Observable
final class AuthManager {
    private(set) var isAuthenticated = false
    private let keychain = KeychainManager()

    func login(email: String, password: String) async throws {
        let response: LoginResponse = try await apiClient.request(.login, body: LoginRequest(email: email, password: password))
        try keychain.set(response.accessToken, key: .accessToken)
        try keychain.set(response.refreshToken, key: .refreshToken)
        isAuthenticated = true
    }

    func accessToken() async -> String? {
        guard let token = keychain.get(.accessToken),
              let expiresAt = keychain.getDate(.accessTokenExpiresAt) else { return nil }
        if expiresAt <= Date().addingTimeInterval(60) {
            do { try await refresh() } catch { return nil }
        }
        return keychain.get(.accessToken)
    }

    func logout() async {
        _ = try? await apiClient.request(Empty.self, .logout)
        try? keychain.delete(.accessToken)
        try? keychain.delete(.refreshToken)
        isAuthenticated = false
    }
}
```

### 6.6 Repositories und SyncEngine

Jedes Repository arbeitet lokal-first:

```swift
protocol GameRepositoryProtocol {
    func list() async throws -> [LocalGame]
    func get(id: String) async throws -> LocalGame?
    func create(_ input: CreateGameInput) async throws -> LocalGame
    func update(id: String, input: UpdateGameInput) async throws -> LocalGame
    func delete(id: String) async throws
}

final class GameRepository: GameRepositoryProtocol {
    private let local: LocalGameDataSource
    private let remote: GameRemoteDataSource
    private let syncEngine: SyncEngine

    func list() async throws -> [LocalGame] {
        // 1. Lokal sofort zurückgeben
        let cached = try await local.list()
        // 2. Im Hintergrund syncen
        Task { try await syncEngine.pull() }
        return cached
    }

    func create(_ input: CreateGameInput) async throws -> LocalGame {
        let localGame = LocalGame(from: input, syncState: .pendingCreate)
        try await local.insert(localGame)
        Task { try await syncEngine.push() }
        return localGame
    }

    func update(id: String, input: UpdateGameInput) async throws -> LocalGame {
        guard let localGame = try await local.get(id) else { throw GameError.notFound }
        localGame.apply(input)
        localGame.syncState = .pendingUpdate
        try await local.save()
        Task { try await syncEngine.push() }
        return localGame
    }

    func delete(id: String) async throws {
        guard let localGame = try await local.get(id) else { throw GameError.notFound }
        localGame.syncState = .pendingDelete
        try await local.save()
        Task { try await syncEngine.push() }
    }
}
```

**SyncEngine:**

```swift
actor SyncEngine {
    private let local: LocalDataSource
    private let remote: RemoteDataSource

    func pull() async throws {
        let lastSync = await local.lastSyncDate()
        let payload: SyncPayload = try await remote.sync(since: lastSync)
        try await local.apply(payload)
        await local.setLastSyncDate(payload.syncedAt)
    }

    func push() async throws {
        let pending = try await local.pendingRecords()
        for record in pending {
            // Dispatch an den passenden Endpunkt basierend auf Record-Typ und syncState
            try await remote.send(record)
            try await local.markSynced(record)
        }
        // Nach Push nochmal pull, um serverseitige IDs/Updates zu erhalten
        try await pull()
    }
}
```

### 6.7 Offline-Verhalten

- **Lesen:** Immer aus SwiftData. Falls leer, blockiere kurz bis erster Pull abgeschlossen.
- **Schreiben:** Lokal speichern + `pendingCreate/Update/Delete` markieren. UI zeigt „Synchronisiert...“ oder „Offline — wird später gesendet“.
- **Löschen:** Soft-Delete lokal, sende DELETE an API, danach entfernen.
- **Konflikte:** Server-`updatedAt` gewinnt. Nach jedem Pull überschreibt der Server-Stand den lokalen Stand, sofern der lokale Record nicht gerade pending ist.
- **Netzwerk-Wiedereintritt:** `NWPathMonitor` erkennt Verbindung, `SyncEngine.push()` und `pull()` automatisch.

---

## 7. Native iOS-Features

### 7.1 Barcode-Scanner

- Eigener SwiftUI-View `BarcodeScannerView`, der `AVCaptureSession` kapselt.
- Scannt EAN-13, EAN-8, UPC-A, UPC-E.
- Erkannten Code an `POST /api/mobile/v1/bgg/lookup` mit Body `{ "ean": "4001504405010" }`.
- Backend sucht EAN in BGG und liefert Vorschläge; Nutzer wählt und importiert.

### 7.2 Cover-OCR

- `ImagePicker` oder Live-Kamera-Stream.
- `VNRecognizeTextRequest` auf dem Bild.
- Erkannter Text wird an `GET /api/mobile/v1/bgg/search?q=<text>` gesendet.
- Nutzer wählt aus Ergebnisliste.

### 7.3 Deep Links / Universal Links

- **Custom URL Scheme:** `boardgametools://public/event/<token>`
- **Universal Link:** `https://boardgametools.vercel.app/public/event/<token>`
- App-Delegate/Scene-Phase-Handler leitet auf `PublicEventView(token:)` weiter.
- Öffentliche Endpoints wiederverwenden.

### 7.4 Push-Benachrichtigungen

- App startet `UIApplication.shared.registerForRemoteNotifications()` nach Login.
- `UNUserNotificationCenter` fordert Berechtigung an.
- Beim Erhalt des APNs-Token: `POST /api/mobile/v1/devices`.
- Background-Handler zeigt In-App-Badge oder öffnet zugehörigen Screen.

---

## 8. Sicherheit und Datenschutz

- **Keychain:** Access- und Refresh-Tokens nur im iOS-Keychain, nicht in `UserDefaults`.
- **Token-Ablauf:** Access 24h, Refresh 30 Tage, Rotation bei Refresh.
- **Certificate Pinning:** Optional für Production-API-Domain.
- **App Attest:** Optional für sensitive Endpunkte (z.B. Abstimmungen).
- **Account-Löschung:** In-App-Screen zum Löschen des Accounts, ruft `DELETE /api/mobile/v1/me` auf. Erforderlich für App Store und DSGVO.
- **Datenschutzlabel:** App muss im App Store Connect erklären: Kontaktinformationen, Nutzungsdaten, ggf. Crash-Daten. Keine Verkauf an Dritte.

---

## 9. App-Store-Vorbereitung

- **Apple Developer Program** erforderlich.
- **Minimum iOS:** 17 (wegen SwiftData/`@Observable`).
- **App Tracking Transparency:** Nur wenn Analytics/Werbung genutzt wird; Push allein erfordert kein ATT.
- **Berechtigungen:** Kamera (Barcode/OCR), Benachrichtigungen, Netzwerk.
- **In-App-Käufe:** In Phase 1 nicht geplant.
- **TestFlight:** Interne Beta vor App-Store-Release.
- **Privacy Policy & Terms:** Verlinkung auf bestehende `/privacy` und `/terms` Seiten.

---

## 10. Phasierung

### Phase 1 — MVP (Ziel: App-Store-Release)

1. Login (E-Mail/Passwort + Sign in with Apple)
2. Dashboard mit Statistik-Kacheln
3. Spielesammlung (Liste, Suche, Detail, anlegen, bearbeiten, löschen)
4. BGG-Suche und -Import
5. Barcode-Scanner und Cover-OCR
6. Sessions erfassen, bearbeiten, löschen
7. Events einsehen, Spielvorschläge, Voting, Terminabstimmung
8. Gruppen, Umfragen, Kommentare
9. Öffentliche Share-Links öffnen (Gast-Modus)
10. SwiftData-Offline-Cache + Sync-Engine
11. Push-Benachrichtigungen (Einladungen, Erinnerungen)

### Phase 2

- Profil & Einstellungen
- Statistiken und Diagramme
- iCal-Export in iOS-Kalender
- Widgets
- iPad/Mac Catalyst-Optimierung

### Phase 3

- Watch-App (optionale Erweiterung)
- Erweiterte Offline-Funktionen (Bilder cachen, vollständiger Sync)
- Teilen über iOS-Share-Sheet

---

## 11. Abhängigkeiten und Risiken

| Risiko | Auswirkung | Mitigation |
|--------|------------|------------|
| Apple Developer Account / APNs-Zertifikat | Blockiert Push und App Store | Frühzeitig einrichten |
| SwiftData Sync bei großen Datenmengen | Performance, Konflikte | Paginierter Sync, nur geänderte Records |
| BGG API-Rate-Limits | Import/Suche langsam | Caching, Nutzer-Feedback |
| NextAuth v5 Beta-Status | API-Änderungen, Apple-Provider-Bugs | Saubere Abstraktion in `api-auth.ts` |
| App-Store-Review für Web-Wrapper-Eindruck | Ablehnung | Klare native UI, keine WebView-Hauptinhalte |

---

## 12. Design-Entscheidungen

1. **Native SwiftUI statt Cross-Platform:** Bester iOS-UX, App Store, nativer Barcode/OCR.
2. **Offline-first mit SwiftData:** Eure explizite Anforderung; klare Trennung zwischen lokalem State und Backend.
3. **Eigener `/api/mobile/v1/` Namespace:** Schützt bestehende Web-Endpoints vor Regressionen und erlaubt mobile-spezifische Payloads.
4. **API-Token statt Cookie:** Native Clients brauchen stateless Auth; Cookie-Management in `URLSession` ist fragil.
5. **Serviceschicht wiederverwenden:** Keine duplizierte Geschäftslogik; jeder Mobile-Endpoint ist ein dünner Wrapper um `src/lib/services/*`.

---

## 13. Referenzen

- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/CONCEPT.md" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/docs/FEATURES.md" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/src/lib/services/index.ts" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/src/lib/auth.ts" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/prisma/schema.prisma" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/src/proxy.ts" />
- <ref_file file="/Users/mha/KundenportalPrototype2/CascadeProjects/windsurf-project/boardgametools/docs/openapi.yaml" />
