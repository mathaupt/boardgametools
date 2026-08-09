# BoardGameTools iOS Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native iOS client (SwiftUI + SwiftData) for the BoardGameTools MVP.

**Architecture:** MVVM with SwiftUI Views and `@Observable` ViewModels, actor-isolated Repositories, a `SyncEngine` for offline-first pull/push, and an `APIClient` over `URLSession` with Keychain-stored bearer tokens.

**Tech Stack:** Swift 6, SwiftUI, SwiftData, URLSession, Keychain (Security framework), AVCapture (barcode), VisionKit/Vision (OCR), AuthenticationServices (Sign in with Apple), UserNotifications (push), `onOpenURL` / Associated Domains for deep links.

---

## File Map

All paths are relative to the Xcode project root `BoardGameTools/` (kept as a sibling folder to the Next.js app root).

```
BoardGameTools.xcodeproj
BoardGameTools/
  BoardGameToolsApp.swift
  Info.plist
  BoardGameTools.entitlements
  Assets.xcassets
  Utilities/
    JSON+ISO8601.swift
  Networking/
    HTTPMethod.swift
    APIError.swift
    Endpoint.swift
    DTOs.swift
    APIClient.swift
  Security/
    KeychainManager.swift
  Services/
    AuthManager.swift
    NotificationManager.swift
    DeepLinkHandler.swift
    NetworkMonitor.swift
  Models/
    SyncState.swift
    LocalGame.swift
    LocalSession.swift
    LocalSessionPlayer.swift
    LocalEvent.swift
    LocalEventProposal.swift
    LocalVote.swift
    LocalDateProposal.swift
    LocalDateVote.swift
    LocalGroup.swift
    LocalGroupMember.swift
    LocalGroupPoll.swift
    LocalGroupPollOption.swift
    LocalGroupPollVote.swift
    LocalGroupComment.swift
    LocalTag.swift
    LocalGameTag.swift
    LocalUser.swift
    LocalSyncMetadata.swift
  Repositories/
    LocalDataSource.swift
    RemoteDataSource.swift
    GameRepository.swift
    SessionRepository.swift
    EventRepository.swift
    GroupRepository.swift
  Sync/
    SyncEngine.swift
  ViewModels/
    LoginViewModel.swift
    DashboardViewModel.swift
    GameListViewModel.swift
    GameEditViewModel.swift
    BGGSearchViewModel.swift
    BarcodeScannerViewModel.swift
    OCRViewModel.swift
    SessionListViewModel.swift
    SessionEditViewModel.swift
    EventListViewModel.swift
    EventDetailViewModel.swift
    GroupListViewModel.swift
    GroupDetailViewModel.swift
    ProfileViewModel.swift
  Views/
    RootView.swift
    MainTabView.swift
    LoginView.swift
    DashboardView.swift
    GameListView.swift
    GameDetailView.swift
    GameEditView.swift
    BGGSearchView.swift
    BarcodeScannerView.swift
    CoverOCRView.swift
    SessionListView.swift
    SessionEditView.swift
    EventListView.swift
    EventDetailView.swift
    GroupListView.swift
    GroupDetailView.swift
    SettingsView.swift
BoardGameToolsTests/
  EndpointTests.swift
  KeychainTests.swift
  AuthManagerTests.swift
  LocalDataSourceTests.swift
  SyncEngineTests.swift
  RepositoryTests.swift
  ViewModelTests.swift
  Helpers.swift
```

**Assumptions before implementation:**
- iOS deployment target is **17.0** (required for SwiftData, `@Observable`, Observation).
- The backend exposes the `/api/mobile/v1/*` namespace described in the iOS design spec.
- The backend accepts a client-provided `id` field on create payloads to keep local-to-remote ID mapping simple.
- The sync payload includes `dateProposals` and `groupComments` as separate `created/updated/deleted` buckets (add them to the backend response if not already present).
- Real barcode/OCR tests run on a physical device or simulator camera; unit tests cover the view-model callbacks and the networking paths.
- No third-party networking/image libraries; use `URLSession`, `AsyncImage`, and `Cache` from the Swift standard library.

### Task 1: Xcode project skeleton and base configuration

**Files:**
- Create: `BoardGameTools.xcodeproj` (Xcode project)
- Create: `BoardGameTools/BoardGameToolsApp.swift`
- Create: `BoardGameTools/Info.plist`
- Create: `BoardGameTools/BoardGameTools.entitlements`
- Create: `BoardGameTools/Assets.xcassets`

- [ ] **Step 1: Create the iOS project**

Open Xcode 16 and create a new project:
- Product Name: `BoardGameTools`
- Bundle Identifier: `de.boardgametools.BoardGameTools`
- Interface: `SwiftUI`
- Language: `Swift`
- Storage: `SwiftData`
- Target: iPhone only, iOS 17 minimum.
- Add a unit-test target named `BoardGameToolsTests` (Swift Testing selected by default).

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```
Expected: `BUILD SUCCEEDED` (main target compiles with the default SwiftUI template).

- [ ] **Step 2: Add required capability entitlements**

Edit `BoardGameTools/BoardGameTools.entitlements`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>development</string>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:boardgametools.vercel.app</string>
    </array>
    <key>keychain-access-groups</key>
    <array/>
</dict>
</plist>
```

Run the build again.
Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Add camera and usage strings**

Edit `BoardGameTools/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Die Kamera wird zum Scannen von Barcodes und zum Lesen von Spielcovern verwendet.</string>
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```
Expected: `BUILD SUCCEEDED`.

- [ ] **Step 4: Commit**

```bash
git add BoardGameTools.xcodeproj BoardGameTools/
git commit -m "chore(ios): Xcode project skeleton, entitlements and Info.plist"
```

### Task 2: JSON ISO8601 coders, HTTP method and API error types

**Files:**
- Create: `BoardGameTools/Utilities/JSON+ISO8601.swift`
- Create: `BoardGameTools/Networking/HTTPMethod.swift`
- Create: `BoardGameTools/Networking/APIError.swift`
- Test: `BoardGameToolsTests/EndpointTests.swift` (also covers `HTTPMethod` and `APIError`)

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/EndpointTests.swift`:
```swift
import Testing
import Foundation
@testable import BoardGameTools

struct EndpointTests {
    @Test func httpMethodRawValue() {
        #expect(HTTPMethod.get.rawValue == "GET")
        #expect(HTTPMethod.post.rawValue == "POST")
    }

    @Test func apiErrorEquality() {
        #expect(APIError.unauthorized == APIError.unauthorized)
        #expect(APIError.invalidURL != APIError.invalidResponse)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/EndpointTests
```
Expected: FAIL with `Cannot find 'HTTPMethod' in scope` and `Cannot find 'APIError' in scope`.

- [ ] **Step 2: Implement the JSON coders and HTTP method**

Create `BoardGameTools/Utilities/JSON+ISO8601.swift`:
```swift
import Foundation

extension JSONEncoder {
    static let iso8601: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()
}

extension JSONDecoder {
    static let iso8601: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
}

extension ISO8601DateFormatter {
    static let shared: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
```

Create `BoardGameTools/Networking/HTTPMethod.swift`:
```swift
import Foundation

enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}
```

Create `BoardGameTools/Networking/APIError.swift`:
```swift
import Foundation

enum APIError: Error, Equatable, Sendable {
    case invalidURL
    case invalidResponse
    case httpError(Int, String?)
    case decodingFailed
    case unauthorized
    case notFound

    var localizedDescription: String {
        switch self {
        case .invalidURL: return "Ungültige URL"
        case .invalidResponse: return "Ungültige Server-Antwort"
        case .httpError(let code, let message):
            return "Server-Fehler \(code): \(message ?? "")"
        case .decodingFailed: return "Daten konnten nicht gelesen werden"
        case .unauthorized: return "Nicht angemeldet"
        case .notFound: return "Nicht gefunden"
        }
    }
}
```

Run the same `EndpointTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Utilities/ BoardGameTools/Networking/ BoardGameToolsTests/EndpointTests.swift
git commit -m "feat(ios): ISO8601 coders, HTTPMethod and APIError"
```

### Task 3: Endpoint enum and DTOs

**Files:**
- Create: `BoardGameTools/Networking/Endpoint.swift`
- Create: `BoardGameTools/Networking/DTOs.swift`
- Test: `BoardGameToolsTests/EndpointTests.swift` (extend existing tests)

- [ ] **Step 1: Write the failing test**

Extend `BoardGameToolsTests/EndpointTests.swift`:
```swift
extension EndpointTests {
    @Test func gamesEndpointPathAndQuery() throws {
        let endpoint = Endpoint.games(page: 2, limit: 25)
        let request = try endpoint.urlRequest(baseURL: URL(string: "https://example.com")!)
        #expect(request.url?.absoluteString == "https://example.com/api/mobile/v1/games?page=2&limit=25")
        #expect(request.httpMethod == "GET")
    }

    @Test func loginRequestBodyEncodes() throws {
        let request = try Endpoint.login.urlRequest(
            baseURL: URL(string: "https://example.com")!,
            body: LoginRequest(email: "a@b.de", password: "geheim")
        )
        let data = request.httpBody ?? Data()
        let decoded = try JSONDecoder.iso8601.decode(LoginRequest.self, from: data)
        #expect(decoded.email == "a@b.de")
        #expect(decoded.password == "geheim")
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/EndpointTests
```
Expected: FAIL with `Cannot find 'Endpoint' in scope` and `Cannot find 'LoginRequest' in scope`.

- [ ] **Step 2: Implement Endpoint and DTOs**

Create `BoardGameTools/Networking/Endpoint.swift`:
```swift
import Foundation

enum Endpoint: Sendable {
    case login
    case refresh
    case logout
    case appleSignIn
    case deleteMe
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
    case updateEvent(id: String)
    case deleteEvent(id: String)
    case proposeGame(eventId: String)
    case voteEvent(eventId: String)
    case dateVoteEvent(eventId: String)
    case groups(page: Int, limit: Int)
    case groupDetail(id: String)
    case createGroup
    case updateGroup(id: String)
    case deleteGroup(id: String)
    case joinGroup(id: String)
    case createPoll(groupId: String)
    case votePoll(groupId: String)
    case commentGroup(groupId: String)
    case sync(since: Date?)
    case uploadImage
    case registerDevice
    case bggSearch(query: String)
    case bggImport
    case bggLookup(ean: String)
    case publicEvent(token: String)
    case publicVote(token: String)

    var path: String {
        switch self {
        case .login: return "/auth/login"
        case .refresh: return "/auth/refresh"
        case .logout: return "/auth/logout"
        case .appleSignIn: return "/auth/apple"
        case .deleteMe: return "/me"
        case .me: return "/me"
        case .dashboard: return "/dashboard"
        case .games, .createGame: return "/games"
        case .gameDetail(let id), .updateGame(let id), .deleteGame(let id): return "/games/\(id)"
        case .sessions, .createSession: return "/sessions"
        case .sessionDetail(let id), .updateSession(let id), .deleteSession(let id): return "/sessions/\(id)"
        case .events, .createEvent: return "/events"
        case .eventDetail(let id), .updateEvent(let id), .deleteEvent(let id): return "/events/\(id)"
        case .proposeGame(let eventId): return "/events/\(eventId)/proposals"
        case .voteEvent(let eventId): return "/events/\(eventId)/votes"
        case .dateVoteEvent(let eventId): return "/events/\(eventId)/date-votes"
        case .groups, .createGroup: return "/groups"
        case .groupDetail(let id), .updateGroup(let id), .deleteGroup(let id), .joinGroup(let id): return "/groups/\(id)"
        case .createPoll(let groupId): return "/groups/\(groupId)/polls"
        case .votePoll(let groupId): return "/groups/\(groupId)/polls/vote"
        case .commentGroup(let groupId): return "/groups/\(groupId)/comments"
        case .sync: return "/sync"
        case .uploadImage: return "/uploads"
        case .registerDevice: return "/devices"
        case .bggSearch: return "/bgg/search"
        case .bggImport: return "/bgg/import"
        case .bggLookup: return "/bgg/lookup"
        case .publicEvent(let token): return "/public/event/\(token)"
        case .publicVote(let token): return "/public/event/\(token)/vote"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .login, .refresh, .logout, .appleSignIn, .createGame, .createSession,
             .createEvent, .proposeGame, .voteEvent, .dateVoteEvent, .createGroup,
             .joinGroup, .createPoll, .votePoll, .commentGroup, .uploadImage,
             .registerDevice, .bggImport, .bggLookup, .publicVote:
            return .post
        case .updateGame, .updateSession, .updateEvent, .updateGroup:
            return .put
        case .deleteGame, .deleteSession, .deleteEvent, .deleteGroup, .deleteMe:
            return .delete
        default:
            return .get
        }
    }

    var queryItems: [URLQueryItem] {
        switch self {
        case .games(let page, let limit),
             .sessions(let page, let limit),
             .events(let page, let limit),
             .groups(let page, let limit):
            return [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "limit", value: String(limit))
            ]
        case .sync(let since):
            if let since {
                return [URLQueryItem(name: "since", value: ISO8601DateFormatter.shared.string(from: since))]
            }
            return []
        case .bggSearch(let query):
            return [URLQueryItem(name: "q", value: query)]
        default:
            return []
        }
    }

    var requiresAuth: Bool {
        switch self {
        case .login, .refresh, .appleSignIn, .publicEvent, .publicVote:
            return false
        default:
            return true
        }
    }

    func urlRequest(baseURL: URL, body: (any Encodable & Sendable)? = nil) throws -> URLRequest {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: true) else {
            throw APIError.invalidURL
        }
        components.path = "/api/mobile/v1" + path
        if !queryItems.isEmpty { components.queryItems = queryItems }
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body {
            request.httpBody = try JSONEncoder.iso8601.encode(body)
        }
        return request
    }
}
```

Create `BoardGameTools/Networking/DTOs.swift`:
```swift
import Foundation

struct EmptyResponse: Codable, Sendable {}

struct LoginRequest: Codable, Sendable {
    let email: String
    let password: String
}

struct LoginResponse: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date?
}

struct RefreshRequest: Codable, Sendable {
    let refreshToken: String
}

struct AppleSignInRequest: Codable, Sendable {
    let identityToken: String
    let authorizationCode: String
    let fullName: String?
}

struct DeviceTokenRequest: Codable, Sendable {
    let deviceToken: String
    let platform: String
    let appVersion: String?
    let locale: String?
}

struct UserDTO: Codable, Sendable {
    let id: String
    let email: String
    let name: String
    let role: String
    let isActive: Bool
}

struct DashboardDTO: Codable, Sendable {
    let totalGames: Int
    let totalSessions: Int
    let upcomingEvents: Int
    let groupsCount: Int
}

// MARK: - Game DTOs

struct GameDTO: Codable, Sendable {
    let id: String
    let name: String
    let description: String?
    let minPlayers: Int
    let maxPlayers: Int
    let playTimeMinutes: Int?
    let complexity: Int?
    let bggId: String?
    let ean: String?
    let imageUrl: String?
    let ownerId: String?
    let createdAt: Date?
    let updatedAt: Date?
    let deletedAt: Date?
    let tagNames: [String]?
}

struct GameWriteDTO: Codable, Sendable {
    let id: String?
    let name: String
    let description: String?
    let minPlayers: Int?
    let maxPlayers: Int?
    let playTimeMinutes: Int?
    let complexity: Int?
    let bggId: String?
    let ean: String?
    let imageUrl: String?
    let tagNames: [String]?
}

// MARK: - Session DTOs

struct SessionPlayerDTO: Codable, Sendable {
    let id: String?
    let userId: String
    let score: Int?
    let isWinner: Bool
    let placement: Int?
}

struct SessionDTO: Codable, Sendable {
    let id: String
    let gameId: String
    let playedAt: Date
    let durationMinutes: Int?
    let notes: String?
    let players: [SessionPlayerDTO]
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
}

struct SessionWriteDTO: Codable, Sendable {
    let id: String?
    let gameId: String
    let playedAt: Date
    let durationMinutes: Int?
    let notes: String?
    let players: [SessionPlayerDTO]
}

// MARK: - Event DTOs

struct VoteDTO: Codable, Sendable {
    let id: String
    let proposalId: String
    let userId: String
    let createdAt: Date
}

struct DateVoteDTO: Codable, Sendable {
    let id: String
    let dateProposalId: String
    let userId: String
    let availability: String
    let createdAt: Date
}

struct EventProposalDTO: Codable, Sendable {
    let id: String
    let eventId: String
    let gameId: String?
    let proposedById: String?
    let bggId: String?
    let bggName: String?
    let bggImageUrl: String?
    let bggMinPlayers: Int?
    let bggMaxPlayers: Int?
    let bggPlayTimeMinutes: Int?
    let voteCount: Int?
    let createdAt: Date
}

struct DateProposalDTO: Codable, Sendable {
    let id: String
    let eventId: String
    let date: Date
    let votes: [DateVoteDTO]?
    let createdAt: Date
}

struct EventDTO: Codable, Sendable {
    let id: String
    let title: String
    let description: String?
    let eventDate: Date
    let location: String?
    let status: String
    let groupId: String?
    let selectedGameId: String?
    let winningProposalId: String?
    let isPublic: Bool?
    let shareToken: String?
    let proposals: [EventProposalDTO]?
    let dateProposals: [DateProposalDTO]?
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
}

struct EventWriteDTO: Codable, Sendable {
    let id: String?
    let title: String
    let description: String?
    let eventDate: Date
    let location: String?
    let groupId: String?
}

struct CreateProposalRequest: Codable, Sendable {
    let gameId: String?
    let bggId: String?
    let bggName: String?
    let bggImageUrl: String?
    let bggMinPlayers: Int?
    let bggMaxPlayers: Int?
    let bggPlayTimeMinutes: Int?
}

struct VoteRequest: Codable, Sendable {
    let proposalId: String
}

struct PublicVoteRequest: Codable, Sendable {
    let proposalId: String
    let voterName: String
}

struct DateVoteRequest: Codable, Sendable {
    let dateProposalId: String
    let availability: String
}

// MARK: - Group DTOs

struct GroupMemberDTO: Codable, Sendable {
    let id: String
    let groupId: String
    let userId: String
    let role: String
    let joinedAt: Date
}

struct GroupPollVoteDTO: Codable, Sendable {
    let id: String
    let optionId: String
    let voterName: String
    let userId: String?
    let createdAt: Date
}

struct GroupPollOptionDTO: Codable, Sendable {
    let id: String
    let pollId: String
    let text: String
    let sortOrder: Int
    let votes: [GroupPollVoteDTO]?
}

struct GroupPollDTO: Codable, Sendable {
    let id: String
    let groupId: String
    let title: String
    let description: String?
    let type: String
    let status: String
    let createdById: String
    let closedAt: Date?
    let options: [GroupPollOptionDTO]?
    let createdAt: Date
}

struct GroupCommentDTO: Codable, Sendable {
    let id: String
    let groupId: String
    let pollId: String?
    let authorName: String
    let userId: String?
    let content: String
    let createdAt: Date
}

struct GroupDTO: Codable, Sendable {
    let id: String
    let name: String
    let description: String?
    let ownerId: String
    let isPublic: Bool
    let shareToken: String?
    let members: [GroupMemberDTO]?
    let events: [EventDTO]?
    let polls: [GroupPollDTO]?
    let comments: [GroupCommentDTO]?
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
}

struct GroupWriteDTO: Codable, Sendable {
    let id: String?
    let name: String
    let description: String?
}

struct JoinGroupRequest: Codable, Sendable {
    let shareToken: String?
}

struct CreatePollRequest: Codable, Sendable {
    let title: String
    let description: String?
    let type: String
    let options: [String]
}

struct PollVoteRequest: Codable, Sendable {
    let optionId: String
}

struct GroupCommentRequest: Codable, Sendable {
    let pollId: String?
    let content: String
}

// MARK: - Sync DTO

struct EntitySyncPayload<T: Codable & Sendable>: Codable, Sendable {
    let created: [T]
    let updated: [T]
    let deleted: [String]
}

struct SyncPayload: Codable, Sendable {
    let syncedAt: Date
    let games: EntitySyncPayload<GameDTO>
    let sessions: EntitySyncPayload<SessionDTO>
    let events: EntitySyncPayload<EventDTO>
    let dateProposals: EntitySyncPayload<DateProposalDTO>
    let groups: EntitySyncPayload<GroupDTO>
    let groupPolls: EntitySyncPayload<GroupPollDTO>
    let groupComments: EntitySyncPayload<GroupCommentDTO>
    let eventProposals: EntitySyncPayload<EventProposalDTO>
    let votes: EntitySyncPayload<VoteDTO>
    let dateVotes: EntitySyncPayload<DateVoteDTO>
    let groupPollVotes: EntitySyncPayload<GroupPollVoteDTO>
    let groupMembers: EntitySyncPayload<GroupMemberDTO>
}

// MARK: - BGG DTOs

struct BGGSearchResultDTO: Codable, Sendable {
    let bggId: String
    let name: String
    let yearPublished: Int?
    let imageUrl: String?
}

struct BGGSearchResponse: Codable, Sendable {
    let results: [BGGSearchResultDTO]
}

struct BGGImportRequest: Codable, Sendable {
    let bggId: String
}

struct BGGLookupRequest: Codable, Sendable {
    let ean: String
}

struct BGGLookupResponse: Codable, Sendable {
    let results: [BGGSearchResultDTO]
}
```

Run the `EndpointTests` command again.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Networking/Endpoint.swift BoardGameTools/Networking/DTOs.swift BoardGameToolsTests/EndpointTests.swift
git commit -m "feat(ios): Endpoint enum and mobile DTOs"
```

### Task 4: KeychainManager

**Files:**
- Create: `BoardGameTools/Security/KeychainManager.swift`
- Test: `BoardGameToolsTests/KeychainTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/KeychainTests.swift`:
```swift
import Testing
@testable import BoardGameTools

struct KeychainTests {
    @Test func setGetDelete() async throws {
        let manager = KeychainManager(service: "test.keychain")
        try await manager.set("secret", key: .accessToken)
        let value = await manager.get(.accessToken)
        #expect(value == "secret")
        try await manager.delete(.accessToken)
        let deleted = await manager.get(.accessToken)
        #expect(deleted == nil)
    }

    @Test func dateStorage() async throws {
        let manager = KeychainManager(service: "test.keychain")
        let now = Date()
        try await manager.setDate(now, key: .accessTokenExpiresAt)
        let read = await manager.getDate(.accessTokenExpiresAt)
        #expect(abs(read!.timeIntervalSince1970 - now.timeIntervalSince1970) < 1)
        try await manager.delete(.accessTokenExpiresAt)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/KeychainTests
```
Expected: FAIL with `Cannot find 'KeychainManager' in scope`.

- [ ] **Step 2: Implement KeychainManager**

Create `BoardGameTools/Security/KeychainManager.swift`:
```swift
import Foundation
import Security

enum KeychainKey: String, Sendable {
    case accessToken
    case refreshToken
    case accessTokenExpiresAt
}

enum KeychainError: Error, Sendable {
    case unableToSave(status: OSStatus)
    case unableToDelete(status: OSStatus)
}

actor KeychainManager {
    private let service: String

    init(service: String = Bundle.main.bundleIdentifier ?? "com.boardgametools.Keychain") {
        self.service = service
    }

    private func makeQuery(key: KeychainKey) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
    }

    func set(_ value: String, key: KeychainKey) async throws {
        let data = Data(value.utf8)
        var query = makeQuery(key: key)
        query[kSecValueData as String] = data

        let status = SecItemAdd(query as CFDictionary, nil)
        if status == errSecDuplicateItem {
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key.rawValue
            ]
            let updates: [String: Any] = [kSecValueData as String: data]
            let updateStatus = SecItemUpdate(updateQuery as CFDictionary, updates as CFDictionary)
            guard updateStatus == errSecSuccess else { throw KeychainError.unableToSave(status: updateStatus) }
        } else if status != errSecSuccess {
            throw KeychainError.unableToSave(status: status)
        }
    }

    func get(_ key: KeychainKey) async -> String? {
        var query = makeQuery(key: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(_ key: KeychainKey) async throws {
        let query = makeQuery(key: key)
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unableToDelete(status: status)
        }
    }

    func setDate(_ date: Date, key: KeychainKey) async throws {
        try await set(String(date.timeIntervalSince1970), key: key)
    }

    func getDate(_ key: KeychainKey) async -> Date? {
        guard let string = await get(key), let interval = Double(string) else { return nil }
        return Date(timeIntervalSince1970: interval)
    }
}
```

Run the `KeychainTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Security/KeychainManager.swift BoardGameToolsTests/KeychainTests.swift
git commit -m "feat(ios): KeychainManager for tokens"
```

### Task 5: APIClient

**Files:**
- Create: `BoardGameTools/Networking/APIClient.swift`
- Test: `BoardGameToolsTests/APIClientTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/APIClientTests.swift`:
```swift
import Testing
import Foundation
@testable import BoardGameTools

final class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (URLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            fatalError("No request handler set")
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

struct APIClientTests {
    @Test func requestAddsBearerAndDecodes() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        let apiClient = APIClient(baseURL: URL(string: "https://api.example.com")!, session: session)
        await apiClient.setTokenProvider { "token123" }

        MockURLProtocol.requestHandler = { request in
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer token123")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            let data = try JSONEncoder.iso8601.encode(LoginResponse(accessToken: "a", refreshToken: "r", expiresAt: nil))
            return (response, data)
        }

        let result: LoginResponse = try await apiClient.request(.me)
        #expect(result.accessToken == "a")
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/APIClientTests
```
Expected: FAIL with `Cannot find 'APIClient' in scope`.

- [ ] **Step 2: Implement APIClient**

Create `BoardGameTools/Networking/APIClient.swift`:
```swift
import Foundation

protocol APIClientProtocol: Sendable {
    func request<T: Decodable & Sendable>(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)?
    ) async throws -> T

    func request(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)?
    ) async throws -> Data

    func setTokenProvider(_ provider: @escaping @Sendable () async -> String?)
}

actor APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private var tokenProvider: (@Sendable () async -> String?)?

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func setTokenProvider(_ provider: @escaping @Sendable () async -> String?) {
        self.tokenProvider = provider
    }

    func request<T: Decodable & Sendable>(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil
    ) async throws -> T {
        let data = try await perform(endpoint, body: body)
        return try JSONDecoder.iso8601.decode(T.self, from: data)
    }

    func request(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil
    ) async throws -> Data {
        return try await perform(endpoint, body: body)
    }

    private func perform(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)?
    ) async throws -> Data {
        var request = try endpoint.urlRequest(baseURL: baseURL, body: body)
        if endpoint.requiresAuth, let token = await tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        return data
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        if (200...299).contains(http.statusCode) { return }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if http.statusCode == 404 { throw APIError.notFound }
        let message = String(data: data, encoding: .utf8)
        throw APIError.httpError(http.statusCode, message)
    }
}
```

Run the `APIClientTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Networking/APIClient.swift BoardGameToolsTests/APIClientTests.swift
git commit -m "feat(ios): actor-isolated APIClient with token provider"
```

### Task 6: AuthManager

**Files:**
- Create: `BoardGameTools/Services/AuthManager.swift`
- Test: `BoardGameToolsTests/AuthManagerTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/AuthManagerTests.swift`:
```swift
import Testing
@testable import BoardGameTools

actor MockAPIClient: APIClientProtocol {
    var responses: [Any] = []
    var endpoints: [Endpoint] = []

    func enqueueResponse(_ response: Any) { responses.append(response) }

    private func nextResponse<T: Decodable & Sendable>() throws -> T {
        guard let typed = responses.removeFirst() as? T else { throw APIError.decodingFailed }
        return typed
    }

    func request<T: Decodable & Sendable>(
        _ endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil
    ) async throws -> T {
        endpoints.append(endpoint)
        return try nextResponse()
    }

    func request(_ endpoint: Endpoint, body: (any Encodable & Sendable)? = nil) async throws -> Data {
        endpoints.append(endpoint)
        return Data()
    }

    func setTokenProvider(_ provider: @escaping @Sendable () async -> String?) {}
}

struct AuthManagerTests {
    @Test @MainActor func loginStoresTokensAndSetsAuthenticated() async throws {
        let apiClient = MockAPIClient()
        apiClient.enqueueResponse(LoginResponse(accessToken: "access", refreshToken: "refresh", expiresAt: nil))
        let keychain = KeychainManager(service: "test.auth")
        let authManager = AuthManager(apiClient: apiClient, keychain: keychain)

        try await authManager.login(email: "test@example.com", password: "password")

        #expect(authManager.isAuthenticated)
        let access = await keychain.get(.accessToken)
        #expect(access == "access")
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/AuthManagerTests
```
Expected: FAIL with `Cannot find 'AuthManager' in scope`.

- [ ] **Step 2: Implement AuthManager**

Create `BoardGameTools/Services/AuthManager.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class AuthManager {
    private(set) var isAuthenticated = false
    private let keychain: KeychainManager
    private let apiClient: any APIClientProtocol

    init(apiClient: any APIClientProtocol, keychain: KeychainManager = KeychainManager()) {
        self.apiClient = apiClient
        self.keychain = keychain
    }

    func checkInitialAuth() async {
        isAuthenticated = await keychain.get(.accessToken) != nil
    }

    func login(email: String, password: String) async throws {
        let request = LoginRequest(email: email, password: password)
        let response: LoginResponse = try await apiClient.request(.login, body: request)
        try await storeTokens(response)
        isAuthenticated = true
    }

    func signInWithApple(identityToken: String, authorizationCode: String, fullName: String?) async throws {
        let request = AppleSignInRequest(
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            fullName: fullName
        )
        let response: LoginResponse = try await apiClient.request(.appleSignIn, body: request)
        try await storeTokens(response)
        isAuthenticated = true
    }

    func accessToken() async -> String? {
        guard let token = await keychain.get(.accessToken) else { return nil }
        guard let expiresAt = await keychain.getDate(.accessTokenExpiresAt) else { return token }
        if expiresAt <= Date().addingTimeInterval(60) {
            do { try await refresh() } catch { return nil }
        }
        return await keychain.get(.accessToken)
    }

    func refresh() async throws {
        guard let refreshToken = await keychain.get(.refreshToken) else { throw APIError.unauthorized }
        let response: LoginResponse = try await apiClient.request(.refresh, body: RefreshRequest(refreshToken: refreshToken))
        try await storeTokens(response)
    }

    func logout() async {
        let _: EmptyResponse? = try? await apiClient.request(.logout)
        try? await keychain.delete(.accessToken)
        try? await keychain.delete(.refreshToken)
        try? await keychain.delete(.accessTokenExpiresAt)
        isAuthenticated = false
    }

    func deleteAccount() async throws {
        let _: EmptyResponse = try await apiClient.request(.deleteMe)
        await logout()
    }

    private func storeTokens(_ response: LoginResponse) async throws {
        try await keychain.set(response.accessToken, key: .accessToken)
        try await keychain.set(response.refreshToken, key: .refreshToken)
        if let expiresAt = response.expiresAt {
            try await keychain.setDate(expiresAt, key: .accessTokenExpiresAt)
        }
    }
}
```

Run the `AuthManagerTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Services/AuthManager.swift BoardGameToolsTests/AuthManagerTests.swift
git commit -m "feat(ios): AuthManager with email, Apple Sign-In and token refresh"
```

### Task 7: SwiftData core models (Game, Session, Event, Vote)

**Files:**
- Create: `BoardGameTools/Models/SyncState.swift`
- Create: `BoardGameTools/Models/LocalGame.swift`
- Create: `BoardGameTools/Models/LocalSession.swift`
- Create: `BoardGameTools/Models/LocalSessionPlayer.swift`
- Create: `BoardGameTools/Models/LocalEvent.swift`
- Create: `BoardGameTools/Models/LocalEventProposal.swift`
- Create: `BoardGameTools/Models/LocalVote.swift`
- Create: `BoardGameTools/Models/LocalDateProposal.swift`
- Create: `BoardGameTools/Models/LocalDateVote.swift`
- Test: `BoardGameToolsTests/ModelTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/ModelTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct ModelTests {
    @Test func coreModelsInsertAndFetch() throws {
        let schema = Schema([LocalGame.self, LocalSession.self, LocalSessionPlayer.self, LocalEvent.self, LocalEventProposal.self, LocalVote.self, LocalDateProposal.self, LocalDateVote.self])
        let container = try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)])
        let context = ModelContext(container)
        let game = LocalGame(id: "g1", name: "Azul", updatedAt: Date())
        context.insert(game)
        try context.save()

        let games = try context.fetch(FetchDescriptor<LocalGame>())
        #expect(games.count == 1)
        #expect(games.first?.name == "Azul")
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/ModelTests
```
Expected: FAIL with `Cannot find 'LocalGame' in scope`.

- [ ] **Step 2: Implement the core model files**

Create `BoardGameTools/Models/SyncState.swift`:
```swift
import Foundation

enum SyncState: String, Codable, Sendable {
    case synced
    case pendingCreate
    case pendingUpdate
    case pendingDelete
}
```

Create `BoardGameTools/Models/LocalGame.swift`:
```swift
import Foundation
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
    var tagNames: [String]?
    var updatedAt: Date
    var syncState: SyncState

    @Relationship(inverse: \LocalSession.game) var sessions: [LocalSession]?
    @Relationship(inverse: \LocalGameTag.game) var gameTags: [LocalGameTag]?

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
        tagNames: [String]? = nil,
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
        self.tagNames = tagNames
        self.updatedAt = updatedAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalSession.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalSession {
    @Attribute(.unique) var id: String
    var gameId: String
    var playedAt: Date
    var durationMinutes: Int?
    var notes: String?
    var createdAt: Date
    var updatedAt: Date
    var syncState: SyncState

    var game: LocalGame?
    @Relationship(inverse: \LocalSessionPlayer.session) var players: [LocalSessionPlayer]?

    init(
        id: String,
        gameId: String,
        playedAt: Date,
        durationMinutes: Int? = nil,
        notes: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.gameId = gameId
        self.playedAt = playedAt
        self.durationMinutes = durationMinutes
        self.notes = notes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalSessionPlayer.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalSessionPlayer {
    @Attribute(.unique) var id: String
    var sessionId: String
    var userId: String
    var score: Int?
    var isWinner: Bool
    var placement: Int?
    var syncState: SyncState

    var session: LocalSession?

    init(
        id: String,
        sessionId: String,
        userId: String,
        score: Int? = nil,
        isWinner: Bool = false,
        placement: Int? = nil,
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.sessionId = sessionId
        self.userId = userId
        self.score = score
        self.isWinner = isWinner
        self.placement = placement
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalEvent.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalEvent {
    @Attribute(.unique) var id: String
    var title: String
    var eventDescription: String?
    var eventDate: Date
    var location: String?
    var status: String
    var groupId: String?
    var selectedGameId: String?
    var winningProposalId: String?
    var isPublic: Bool
    var shareToken: String?
    var createdAt: Date
    var updatedAt: Date
    var syncState: SyncState

    @Relationship(inverse: \LocalEventProposal.event) var proposals: [LocalEventProposal]?
    @Relationship(inverse: \LocalDateProposal.event) var dateProposals: [LocalDateProposal]?

    init(
        id: String,
        title: String,
        eventDescription: String? = nil,
        eventDate: Date,
        location: String? = nil,
        status: String = "draft",
        groupId: String? = nil,
        selectedGameId: String? = nil,
        winningProposalId: String? = nil,
        isPublic: Bool = false,
        shareToken: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.title = title
        self.eventDescription = eventDescription
        self.eventDate = eventDate
        self.location = location
        self.status = status
        self.groupId = groupId
        self.selectedGameId = selectedGameId
        self.winningProposalId = winningProposalId
        self.isPublic = isPublic
        self.shareToken = shareToken
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalEventProposal.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalEventProposal {
    @Attribute(.unique) var id: String
    var eventId: String
    var gameId: String?
    var proposedById: String?
    var bggId: String?
    var bggName: String?
    var bggImageUrl: String?
    var bggMinPlayers: Int?
    var bggMaxPlayers: Int?
    var bggPlayTimeMinutes: Int?
    var createdAt: Date
    var syncState: SyncState

    var event: LocalEvent?
    @Relationship(inverse: \LocalVote.proposal) var votes: [LocalVote]?

    init(
        id: String,
        eventId: String,
        gameId: String? = nil,
        proposedById: String? = nil,
        bggId: String? = nil,
        bggName: String? = nil,
        bggImageUrl: String? = nil,
        bggMinPlayers: Int? = nil,
        bggMaxPlayers: Int? = nil,
        bggPlayTimeMinutes: Int? = nil,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.eventId = eventId
        self.gameId = gameId
        self.proposedById = proposedById
        self.bggId = bggId
        self.bggName = bggName
        self.bggImageUrl = bggImageUrl
        self.bggMinPlayers = bggMinPlayers
        self.bggMaxPlayers = bggMaxPlayers
        self.bggPlayTimeMinutes = bggPlayTimeMinutes
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalVote.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalVote {
    @Attribute(.unique) var id: String
    var proposalId: String
    var userId: String
    var createdAt: Date
    var syncState: SyncState

    var proposal: LocalEventProposal?

    init(
        id: String,
        proposalId: String,
        userId: String,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.proposalId = proposalId
        self.userId = userId
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalDateProposal.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalDateProposal {
    @Attribute(.unique) var id: String
    var eventId: String
    var proposedDate: Date
    var createdAt: Date
    var syncState: SyncState

    var event: LocalEvent?
    @Relationship(inverse: \LocalDateVote.dateProposal) var votes: [LocalDateVote]?

    init(
        id: String,
        eventId: String,
        proposedDate: Date,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.eventId = eventId
        self.proposedDate = proposedDate
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalDateVote.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalDateVote {
    @Attribute(.unique) var id: String
    var dateProposalId: String
    var userId: String
    var availability: String
    var createdAt: Date
    var syncState: SyncState

    var dateProposal: LocalDateProposal?

    init(
        id: String,
        dateProposalId: String,
        userId: String,
        availability: String = "yes",
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.dateProposalId = dateProposalId
        self.userId = userId
        self.availability = availability
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Run the `ModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Models/ BoardGameToolsTests/ModelTests.swift
git commit -m "feat(ios): SwiftData core models"
```

### Task 8: SwiftData group, tag, user and sync metadata models

**Files:**
- Create: `BoardGameTools/Models/LocalGroup.swift`
- Create: `BoardGameTools/Models/LocalGroupMember.swift`
- Create: `BoardGameTools/Models/LocalGroupPoll.swift`
- Create: `BoardGameTools/Models/LocalGroupPollOption.swift`
- Create: `BoardGameTools/Models/LocalGroupPollVote.swift`
- Create: `BoardGameTools/Models/LocalGroupComment.swift`
- Create: `BoardGameTools/Models/LocalTag.swift`
- Create: `BoardGameTools/Models/LocalGameTag.swift`
- Create: `BoardGameTools/Models/LocalUser.swift`
- Create: `BoardGameTools/Models/LocalSyncMetadata.swift`
- Test: `BoardGameToolsTests/ModelTests.swift` (extend existing)

- [ ] **Step 1: Write the failing test**

Extend `BoardGameToolsTests/ModelTests.swift`:
```swift
extension ModelTests {
    @Test func groupModelInsertAndFetch() throws {
        let schema = Schema([LocalGroup.self, LocalGroupMember.self, LocalGroupPoll.self, LocalGroupPollOption.self, LocalGroupPollVote.self, LocalGroupComment.self, LocalTag.self, LocalGameTag.self, LocalUser.self, LocalSyncMetadata.self])
        let container = try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)])
        let context = ModelContext(container)
        let group = LocalGroup(id: "gr1", name: "Freitagsrunde", ownerId: "u1")
        context.insert(group)
        try context.save()

        let groups = try context.fetch(FetchDescriptor<LocalGroup>())
        #expect(groups.count == 1)
        #expect(groups.first?.name == "Freitagsrunde")
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/ModelTests
```
Expected: FAIL with `Cannot find 'LocalGroup' in scope`.

- [ ] **Step 2: Implement the remaining model files**

Create `BoardGameTools/Models/LocalGroup.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroup {
    @Attribute(.unique) var id: String
    var name: String
    var groupDescription: String?
    var ownerId: String
    var isPublic: Bool
    var shareToken: String?
    var createdAt: Date
    var updatedAt: Date
    var syncState: SyncState

    @Relationship(inverse: \LocalGroupMember.group) var members: [LocalGroupMember]?
    @Relationship(inverse: \LocalGroupPoll.group) var polls: [LocalGroupPoll]?
    @Relationship(inverse: \LocalGroupComment.group) var comments: [LocalGroupComment]?

    init(
        id: String,
        name: String,
        groupDescription: String? = nil,
        ownerId: String,
        isPublic: Bool = false,
        shareToken: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.name = name
        self.groupDescription = groupDescription
        self.ownerId = ownerId
        self.isPublic = isPublic
        self.shareToken = shareToken
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGroupMember.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroupMember {
    @Attribute(.unique) var id: String
    var groupId: String
    var userId: String
    var role: String
    var joinedAt: Date
    var syncState: SyncState

    var group: LocalGroup?

    init(
        id: String,
        groupId: String,
        userId: String,
        role: String = "member",
        joinedAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.groupId = groupId
        self.userId = userId
        self.role = role
        self.joinedAt = joinedAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGroupPoll.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroupPoll {
    @Attribute(.unique) var id: String
    var groupId: String
    var title: String
    var pollDescription: String?
    var type: String
    var status: String
    var createdById: String
    var closedAt: Date?
    var createdAt: Date
    var syncState: SyncState

    var group: LocalGroup?
    @Relationship(inverse: \LocalGroupPollOption.poll) var options: [LocalGroupPollOption]?
    @Relationship(inverse: \LocalGroupComment.poll) var comments: [LocalGroupComment]?

    init(
        id: String,
        groupId: String,
        title: String,
        pollDescription: String? = nil,
        type: String = "single",
        status: String = "open",
        createdById: String,
        closedAt: Date? = nil,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.groupId = groupId
        self.title = title
        self.pollDescription = pollDescription
        self.type = type
        self.status = status
        self.createdById = createdById
        self.closedAt = closedAt
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGroupPollOption.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroupPollOption {
    @Attribute(.unique) var id: String
    var pollId: String
    var text: String
    var sortOrder: Int
    var syncState: SyncState

    var poll: LocalGroupPoll?
    @Relationship(inverse: \LocalGroupPollVote.option) var votes: [LocalGroupPollVote]?

    init(
        id: String,
        pollId: String,
        text: String,
        sortOrder: Int = 0,
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.pollId = pollId
        self.text = text
        self.sortOrder = sortOrder
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGroupPollVote.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroupPollVote {
    @Attribute(.unique) var id: String
    var optionId: String
    var voterName: String
    var userId: String?
    var createdAt: Date
    var syncState: SyncState

    var option: LocalGroupPollOption?

    init(
        id: String,
        optionId: String,
        voterName: String,
        userId: String? = nil,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.optionId = optionId
        self.voterName = voterName
        self.userId = userId
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGroupComment.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGroupComment {
    @Attribute(.unique) var id: String
    var groupId: String
    var pollId: String?
    var authorName: String
    var userId: String?
    var content: String
    var createdAt: Date
    var syncState: SyncState

    var group: LocalGroup?
    var poll: LocalGroupPoll?

    init(
        id: String,
        groupId: String,
        pollId: String? = nil,
        authorName: String,
        userId: String? = nil,
        content: String,
        createdAt: Date = Date(),
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.groupId = groupId
        self.pollId = pollId
        self.authorName = authorName
        self.userId = userId
        self.content = content
        self.createdAt = createdAt
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalTag.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalTag {
    @Attribute(.unique) var id: String
    var name: String
    var ownerId: String
    var source: String
    var syncState: SyncState

    @Relationship(inverse: \LocalGameTag.tag) var gameTags: [LocalGameTag]?

    init(
        id: String,
        name: String,
        ownerId: String,
        source: String = "manual",
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.name = name
        self.ownerId = ownerId
        self.source = source
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalGameTag.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalGameTag {
    @Attribute(.unique) var id: String
    var gameId: String
    var tagId: String
    var syncState: SyncState

    var game: LocalGame?
    var tag: LocalTag?

    init(
        id: String,
        gameId: String,
        tagId: String,
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.gameId = gameId
        self.tagId = tagId
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalUser.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalUser {
    @Attribute(.unique) var id: String
    var email: String
    var name: String
    var role: String
    var isActive: Bool
    var syncState: SyncState

    init(
        id: String,
        email: String,
        name: String,
        role: String = "USER",
        isActive: Bool = true,
        syncState: SyncState = .synced
    ) {
        self.id = id
        self.email = email
        self.name = name
        self.role = role
        self.isActive = isActive
        self.syncState = syncState
    }
}
```

Create `BoardGameTools/Models/LocalSyncMetadata.swift`:
```swift
import Foundation
import SwiftData

@Model
final class LocalSyncMetadata {
    var lastSyncAt: Date?

    init(lastSyncAt: Date? = nil) {
        self.lastSyncAt = lastSyncAt
    }
}
```

Run the `ModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Models/ BoardGameToolsTests/ModelTests.swift
git commit -m "feat(ios): group, tag, user and sync metadata SwiftData models"
```

### Task 9: LocalDataSource with SwiftData sync apply

**Files:**
- Create: `BoardGameTools/Repositories/LocalDataSource.swift`
- Create: `BoardGameToolsTests/Helpers.swift`
- Create: `BoardGameToolsTests/LocalDataSourceTests.swift`

- [ ] **Step 1: Write the failing test and test helper**

Create `BoardGameToolsTests/Helpers.swift`:
```swift
import SwiftData
@testable import BoardGameTools

extension ModelContainer {
    static func inMemory() throws -> ModelContainer {
        let schema = Schema([
            LocalGame.self, LocalSession.self, LocalSessionPlayer.self,
            LocalEvent.self, LocalEventProposal.self, LocalVote.self,
            LocalDateProposal.self, LocalDateVote.self, LocalGroup.self,
            LocalGroupMember.self, LocalGroupPoll.self, LocalGroupPollOption.self,
            LocalGroupPollVote.self, LocalGroupComment.self, LocalTag.self,
            LocalGameTag.self, LocalUser.self, LocalSyncMetadata.self
        ])
        return try ModelContainer(
            for: schema,
            configurations: [ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)]
        )
    }
}
```

Create `BoardGameToolsTests/LocalDataSourceTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct LocalDataSourceTests {
    @Test func applyCreatesGame() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let payload = SyncPayload(
            syncedAt: Date(),
            games: EntitySyncPayload(
                created: [GameDTO(id: "g1", name: "Azul", description: nil, minPlayers: 2, maxPlayers: 4, playTimeMinutes: nil, complexity: nil, bggId: nil, ean: nil, imageUrl: nil, ownerId: nil, createdAt: nil, updatedAt: Date(), deletedAt: nil, tagNames: nil)],
                updated: [],
                deleted: []
            ),
            sessions: emptySyncPayload(),
            events: emptySyncPayload(),
            dateProposals: emptySyncPayload(),
            groups: emptySyncPayload(),
            groupPolls: emptySyncPayload(),
            groupComments: emptySyncPayload(),
            eventProposals: emptySyncPayload(),
            votes: emptySyncPayload(),
            dateVotes: emptySyncPayload(),
            groupPollVotes: emptySyncPayload(),
            groupMembers: emptySyncPayload()
        )
        try await local.apply(payload)
        let games = try await local.fetchGames()
        #expect(games.count == 1)
        #expect(games.first?.name == "Azul")
    }

    private func emptySyncPayload<T: Codable & Sendable>() -> EntitySyncPayload<T> {
        EntitySyncPayload(created: [], updated: [], deleted: [])
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/LocalDataSourceTests
```
Expected: FAIL with `Cannot find 'LocalDataSource' in scope`.

- [ ] **Step 2: Implement LocalDataSource**

Create `BoardGameTools/Repositories/LocalDataSource.swift`:
```swift
import Foundation
import SwiftData

@ModelActor
actor LocalDataSource {
    func lastSyncDate() async -> Date? {
        let descriptor = FetchDescriptor<LocalSyncMetadata>()
        do { return try modelContext.fetch(descriptor).first?.lastSyncAt } catch { return nil }
    }

    func setLastSyncDate(_ date: Date) async throws {
        let descriptor = FetchDescriptor<LocalSyncMetadata>()
        let existing = (try? modelContext.fetch(descriptor))?.first
        let metadata = existing ?? LocalSyncMetadata(lastSyncAt: date)
        metadata.lastSyncAt = date
        if existing == nil { modelContext.insert(metadata) }
        try modelContext.save()
    }

    func fetchGames() async throws -> [LocalGame] {
        var descriptor = FetchDescriptor<LocalGame>()
        descriptor.sortBy = [SortDescriptor(\.name, order: .forward)]
        return try modelContext.fetch(descriptor)
    }

    func fetchGame(id: String) async throws -> LocalGame? {
        let descriptor = FetchDescriptor<LocalGame>(predicate: #Predicate { $0.id == id })
        return try modelContext.fetch(descriptor).first
    }

    func fetchSessions() async throws -> [LocalSession] {
        var descriptor = FetchDescriptor<LocalSession>()
        descriptor.sortBy = [SortDescriptor(\.playedAt, order: .reverse)]
        return try modelContext.fetch(descriptor)
    }

    func fetchSession(id: String) async throws -> LocalSession? {
        let descriptor = FetchDescriptor<LocalSession>(predicate: #Predicate { $0.id == id })
        return try modelContext.fetch(descriptor).first
    }

    func fetchEvents() async throws -> [LocalEvent] {
        var descriptor = FetchDescriptor<LocalEvent>()
        descriptor.sortBy = [SortDescriptor(\.eventDate, order: .reverse)]
        return try modelContext.fetch(descriptor)
    }

    func fetchEvent(id: String) async throws -> LocalEvent? {
        let descriptor = FetchDescriptor<LocalEvent>(predicate: #Predicate { $0.id == id })
        return try modelContext.fetch(descriptor).first
    }

    func fetchGroups() async throws -> [LocalGroup] {
        var descriptor = FetchDescriptor<LocalGroup>()
        descriptor.sortBy = [SortDescriptor(\.updatedAt, order: .reverse)]
        return try modelContext.fetch(descriptor)
    }

    func fetchGroup(id: String) async throws -> LocalGroup? {
        let descriptor = FetchDescriptor<LocalGroup>(predicate: #Predicate { $0.id == id })
        return try modelContext.fetch(descriptor).first
    }

    func insert<T: PersistentModel>(_ model: T) async throws {
        modelContext.insert(model)
        try modelContext.save()
    }

    func save() async throws {
        try modelContext.save()
    }

    func delete<T: PersistentModel>(_ model: T) async throws {
        modelContext.delete(model)
        try modelContext.save()
    }

    // MARK: - Apply sync payload

    func apply(_ payload: SyncPayload) async throws {
        try applyGames(payload.games)
        try applyGroups(payload.groups)
        try applyEvents(payload.events)
        try applyDateProposals(payload.dateProposals)
        try applyEventProposals(payload.eventProposals)
        try applyGroupPolls(payload.groupPolls)
        try applyVotes(payload.votes)
        try applyDateVotes(payload.dateVotes)
        try applyGroupMembers(payload.groupMembers)
        try applyGroupPollVotes(payload.groupPollVotes)
        try applyGroupComments(payload.groupComments)
        try applySessions(payload.sessions)
        try modelContext.save()
    }

    // MARK: - Pending queries

    func pendingGames() async throws -> [LocalGame] {
        var descriptor = FetchDescriptor<LocalGame>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingSessions() async throws -> [LocalSession] {
        var descriptor = FetchDescriptor<LocalSession>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingEvents() async throws -> [LocalEvent] {
        var descriptor = FetchDescriptor<LocalEvent>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingGroups() async throws -> [LocalGroup] {
        var descriptor = FetchDescriptor<LocalGroup>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingEventProposals() async throws -> [LocalEventProposal] {
        var descriptor = FetchDescriptor<LocalEventProposal>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingVotes() async throws -> [LocalVote] {
        var descriptor = FetchDescriptor<LocalVote>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingDateProposals() async throws -> [LocalDateProposal] {
        var descriptor = FetchDescriptor<LocalDateProposal>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingDateVotes() async throws -> [LocalDateVote] {
        var descriptor = FetchDescriptor<LocalDateVote>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingGroupPolls() async throws -> [LocalGroupPoll] {
        var descriptor = FetchDescriptor<LocalGroupPoll>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingGroupPollVotes() async throws -> [LocalGroupPollVote] {
        var descriptor = FetchDescriptor<LocalGroupPollVote>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingGroupComments() async throws -> [LocalGroupComment] {
        var descriptor = FetchDescriptor<LocalGroupComment>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    func pendingGroupMembers() async throws -> [LocalGroupMember] {
        var descriptor = FetchDescriptor<LocalGroupMember>(predicate: #Predicate { $0.syncState != SyncState.synced })
        return try modelContext.fetch(descriptor)
    }

    // MARK: - Generic sync payload applier

    private func applySyncPayload<TDTO: Codable & Sendable, TModel: PersistentModel>(
        _ payload: EntitySyncPayload<TDTO>,
        idKeyPath: KeyPath<TDTO, String>,
        create: (TDTO) -> TModel,
        update: (TModel, TDTO) -> Void,
        fetch: (String) -> TModel?
    ) throws {
        for dto in payload.created {
            let model = create(dto)
            modelContext.insert(model)
        }
        for dto in payload.updated {
            let id = dto[keyPath: idKeyPath]
            if let model = fetch(id) { update(model, dto) }
        }
        for id in payload.deleted {
            if let model = fetch(id) { modelContext.delete(model) }
        }
    }

    // MARK: - Fetch helpers

    private func game(by id: String) -> LocalGame? {
        let descriptor = FetchDescriptor<LocalGame>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func session(by id: String) -> LocalSession? {
        let descriptor = FetchDescriptor<LocalSession>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func event(by id: String) -> LocalEvent? {
        let descriptor = FetchDescriptor<LocalEvent>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func eventProposal(by id: String) -> LocalEventProposal? {
        let descriptor = FetchDescriptor<LocalEventProposal>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func vote(by id: String) -> LocalVote? {
        let descriptor = FetchDescriptor<LocalVote>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func dateProposal(by id: String) -> LocalDateProposal? {
        let descriptor = FetchDescriptor<LocalDateProposal>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func dateVote(by id: String) -> LocalDateVote? {
        let descriptor = FetchDescriptor<LocalDateVote>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func group(by id: String) -> LocalGroup? {
        let descriptor = FetchDescriptor<LocalGroup>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func groupMember(by id: String) -> LocalGroupMember? {
        let descriptor = FetchDescriptor<LocalGroupMember>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func groupPoll(by id: String) -> LocalGroupPoll? {
        let descriptor = FetchDescriptor<LocalGroupPoll>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func groupPollOption(by id: String) -> LocalGroupPollOption? {
        let descriptor = FetchDescriptor<LocalGroupPollOption>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func groupPollVote(by id: String) -> LocalGroupPollVote? {
        let descriptor = FetchDescriptor<LocalGroupPollVote>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    private func groupComment(by id: String) -> LocalGroupComment? {
        let descriptor = FetchDescriptor<LocalGroupComment>(predicate: #Predicate { $0.id == id })
        return (try? modelContext.fetch(descriptor))?.first
    }

    // MARK: - Per-entity apply

    private func applyGames(_ payload: EntitySyncPayload<GameDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                LocalGame(
                    id: dto.id,
                    name: dto.name,
                    gameDescription: dto.description,
                    minPlayers: dto.minPlayers,
                    maxPlayers: dto.maxPlayers,
                    playTimeMinutes: dto.playTimeMinutes,
                    complexity: dto.complexity,
                    bggId: dto.bggId,
                    ean: dto.ean,
                    imageUrl: dto.imageUrl,
                    tagNames: dto.tagNames,
                    updatedAt: dto.updatedAt ?? Date(),
                    syncState: .synced
                )
            },
            update: { game, dto in
                game.name = dto.name
                game.gameDescription = dto.description
                game.minPlayers = dto.minPlayers
                game.maxPlayers = dto.maxPlayers
                game.playTimeMinutes = dto.playTimeMinutes
                game.complexity = dto.complexity
                game.bggId = dto.bggId
                game.ean = dto.ean
                game.imageUrl = dto.imageUrl
                game.tagNames = dto.tagNames
                game.updatedAt = dto.updatedAt ?? Date()
                game.syncState = .synced
            },
            fetch: game(by:)
        )
    }

    private func applySessions(_ payload: EntitySyncPayload<SessionDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let session = LocalSession(
                    id: dto.id,
                    gameId: dto.gameId,
                    playedAt: dto.playedAt,
                    durationMinutes: dto.durationMinutes,
                    notes: dto.notes,
                    createdAt: dto.createdAt,
                    updatedAt: dto.updatedAt,
                    syncState: .synced
                )
                session.game = game(by: dto.gameId)
                for playerDTO in dto.players {
                    let player = LocalSessionPlayer(
                        id: playerDTO.id ?? UUID().uuidString,
                        sessionId: dto.id,
                        userId: playerDTO.userId,
                        score: playerDTO.score,
                        isWinner: playerDTO.isWinner,
                        placement: playerDTO.placement,
                        syncState: .synced
                    )
                    player.session = session
                    modelContext.insert(player)
                }
                return session
            },
            update: { session, dto in
                session.gameId = dto.gameId
                session.playedAt = dto.playedAt
                session.durationMinutes = dto.durationMinutes
                session.notes = dto.notes
                session.updatedAt = dto.updatedAt
                session.game = game(by: dto.gameId)
                if let existingPlayers = session.players {
                    for player in existingPlayers { modelContext.delete(player) }
                }
                for playerDTO in dto.players {
                    let player = LocalSessionPlayer(
                        id: playerDTO.id ?? UUID().uuidString,
                        sessionId: dto.id,
                        userId: playerDTO.userId,
                        score: playerDTO.score,
                        isWinner: playerDTO.isWinner,
                        placement: playerDTO.placement,
                        syncState: .synced
                    )
                    player.session = session
                    modelContext.insert(player)
                }
                session.syncState = .synced
            },
            fetch: session(by:)
        )
    }

    private func applyEvents(_ payload: EntitySyncPayload<EventDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                LocalEvent(
                    id: dto.id,
                    title: dto.title,
                    eventDescription: dto.description,
                    eventDate: dto.eventDate,
                    location: dto.location,
                    status: dto.status,
                    groupId: dto.groupId,
                    selectedGameId: dto.selectedGameId,
                    winningProposalId: dto.winningProposalId,
                    isPublic: dto.isPublic ?? false,
                    shareToken: dto.shareToken,
                    createdAt: dto.createdAt,
                    updatedAt: dto.updatedAt,
                    syncState: .synced
                )
            },
            update: { event, dto in
                event.title = dto.title
                event.eventDescription = dto.description
                event.eventDate = dto.eventDate
                event.location = dto.location
                event.status = dto.status
                event.groupId = dto.groupId
                event.selectedGameId = dto.selectedGameId
                event.winningProposalId = dto.winningProposalId
                event.isPublic = dto.isPublic ?? event.isPublic
                event.shareToken = dto.shareToken ?? event.shareToken
                event.updatedAt = dto.updatedAt
                event.syncState = .synced
            },
            fetch: event(by:)
        )
    }

    private func applyEventProposals(_ payload: EntitySyncPayload<EventProposalDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let proposal = LocalEventProposal(
                    id: dto.id,
                    eventId: dto.eventId,
                    gameId: dto.gameId,
                    proposedById: dto.proposedById,
                    bggId: dto.bggId,
                    bggName: dto.bggName,
                    bggImageUrl: dto.bggImageUrl,
                    bggMinPlayers: dto.bggMinPlayers,
                    bggMaxPlayers: dto.bggMaxPlayers,
                    bggPlayTimeMinutes: dto.bggPlayTimeMinutes,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                proposal.event = event(by: dto.eventId)
                return proposal
            },
            update: { proposal, dto in
                proposal.eventId = dto.eventId
                proposal.gameId = dto.gameId
                proposal.proposedById = dto.proposedById
                proposal.bggId = dto.bggId
                proposal.bggName = dto.bggName
                proposal.bggImageUrl = dto.bggImageUrl
                proposal.bggMinPlayers = dto.bggMinPlayers
                proposal.bggMaxPlayers = dto.bggMaxPlayers
                proposal.bggPlayTimeMinutes = dto.bggPlayTimeMinutes
                proposal.event = event(by: dto.eventId)
                proposal.syncState = .synced
            },
            fetch: eventProposal(by:)
        )
    }

    private func applyDateProposals(_ payload: EntitySyncPayload<DateProposalDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let proposal = LocalDateProposal(
                    id: dto.id,
                    eventId: dto.eventId,
                    proposedDate: dto.date,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                proposal.event = event(by: dto.eventId)
                return proposal
            },
            update: { proposal, dto in
                proposal.eventId = dto.eventId
                proposal.proposedDate = dto.date
                proposal.event = event(by: dto.eventId)
                proposal.syncState = .synced
            },
            fetch: dateProposal(by:)
        )
    }

    private func applyVotes(_ payload: EntitySyncPayload<VoteDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let vote = LocalVote(
                    id: dto.id,
                    proposalId: dto.proposalId,
                    userId: dto.userId,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                vote.proposal = eventProposal(by: dto.proposalId)
                return vote
            },
            update: { vote, dto in
                vote.proposalId = dto.proposalId
                vote.userId = dto.userId
                vote.proposal = eventProposal(by: dto.proposalId)
                vote.syncState = .synced
            },
            fetch: vote(by:)
        )
    }

    private func applyDateVotes(_ payload: EntitySyncPayload<DateVoteDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let vote = LocalDateVote(
                    id: dto.id,
                    dateProposalId: dto.dateProposalId,
                    userId: dto.userId,
                    availability: dto.availability,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                vote.dateProposal = dateProposal(by: dto.dateProposalId)
                return vote
            },
            update: { vote, dto in
                vote.dateProposalId = dto.dateProposalId
                vote.userId = dto.userId
                vote.availability = dto.availability
                vote.dateProposal = dateProposal(by: dto.dateProposalId)
                vote.syncState = .synced
            },
            fetch: dateVote(by:)
        )
    }

    private func applyGroups(_ payload: EntitySyncPayload<GroupDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                LocalGroup(
                    id: dto.id,
                    name: dto.name,
                    groupDescription: dto.description,
                    ownerId: dto.ownerId,
                    isPublic: dto.isPublic,
                    shareToken: dto.shareToken,
                    createdAt: dto.createdAt,
                    updatedAt: dto.updatedAt,
                    syncState: .synced
                )
            },
            update: { group, dto in
                group.name = dto.name
                group.groupDescription = dto.description
                group.ownerId = dto.ownerId
                group.isPublic = dto.isPublic
                group.shareToken = dto.shareToken ?? group.shareToken
                group.updatedAt = dto.updatedAt
                group.syncState = .synced
            },
            fetch: group(by:)
        )
    }

    private func applyGroupMembers(_ payload: EntitySyncPayload<GroupMemberDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let member = LocalGroupMember(
                    id: dto.id,
                    groupId: dto.groupId,
                    userId: dto.userId,
                    role: dto.role,
                    joinedAt: dto.joinedAt,
                    syncState: .synced
                )
                member.group = group(by: dto.groupId)
                return member
            },
            update: { member, dto in
                member.groupId = dto.groupId
                member.userId = dto.userId
                member.role = dto.role
                member.joinedAt = dto.joinedAt
                member.group = group(by: dto.groupId)
                member.syncState = .synced
            },
            fetch: groupMember(by:)
        )
    }

    private func applyGroupPolls(_ payload: EntitySyncPayload<GroupPollDTO>) throws {
        for dto in payload.created {
            let poll = LocalGroupPoll(
                id: dto.id,
                groupId: dto.groupId,
                title: dto.title,
                pollDescription: dto.description,
                type: dto.type,
                status: dto.status,
                createdById: dto.createdById,
                closedAt: dto.closedAt,
                createdAt: dto.createdAt,
                syncState: .synced
            )
            poll.group = group(by: dto.groupId)
            if let options = dto.options {
                for optionDTO in options {
                    let option = LocalGroupPollOption(
                        id: optionDTO.id,
                        pollId: dto.id,
                        text: optionDTO.text,
                        sortOrder: optionDTO.sortOrder,
                        syncState: .synced
                    )
                    option.poll = poll
                    modelContext.insert(option)
                }
            }
            modelContext.insert(poll)
        }
        for dto in payload.updated {
            if let poll = groupPoll(by: dto.id) {
                poll.groupId = dto.groupId
                poll.title = dto.title
                poll.pollDescription = dto.description
                poll.type = dto.type
                poll.status = dto.status
                poll.createdById = dto.createdById
                poll.closedAt = dto.closedAt
                poll.group = group(by: dto.groupId)
                if let options = dto.options {
                    for optionDTO in options {
                        if let existing = groupPollOption(by: optionDTO.id) {
                            existing.text = optionDTO.text
                            existing.sortOrder = optionDTO.sortOrder
                            existing.syncState = .synced
                        } else {
                            let option = LocalGroupPollOption(
                                id: optionDTO.id,
                                pollId: dto.id,
                                text: optionDTO.text,
                                sortOrder: optionDTO.sortOrder,
                                syncState: .synced
                            )
                            option.poll = poll
                            modelContext.insert(option)
                        }
                    }
                }
                poll.syncState = .synced
            }
        }
        for id in payload.deleted {
            if let poll = groupPoll(by: id) { modelContext.delete(poll) }
        }
    }

    private func applyGroupPollVotes(_ payload: EntitySyncPayload<GroupPollVoteDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let vote = LocalGroupPollVote(
                    id: dto.id,
                    optionId: dto.optionId,
                    voterName: dto.voterName,
                    userId: dto.userId,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                vote.option = groupPollOption(by: dto.optionId)
                return vote
            },
            update: { vote, dto in
                vote.optionId = dto.optionId
                vote.voterName = dto.voterName
                vote.userId = dto.userId
                vote.option = groupPollOption(by: dto.optionId)
                vote.syncState = .synced
            },
            fetch: groupPollVote(by:)
        )
    }

    private func applyGroupComments(_ payload: EntitySyncPayload<GroupCommentDTO>) throws {
        try applySyncPayload(
            payload,
            idKeyPath: \.id,
            create: { dto in
                let comment = LocalGroupComment(
                    id: dto.id,
                    groupId: dto.groupId,
                    pollId: dto.pollId,
                    authorName: dto.authorName,
                    userId: dto.userId,
                    content: dto.content,
                    createdAt: dto.createdAt,
                    syncState: .synced
                )
                comment.group = group(by: dto.groupId)
                comment.poll = dto.pollId != nil ? groupPoll(by: dto.pollId!) : nil
                return comment
            },
            update: { comment, dto in
                comment.groupId = dto.groupId
                comment.pollId = dto.pollId
                comment.authorName = dto.authorName
                comment.userId = dto.userId
                comment.content = dto.content
                comment.group = group(by: dto.groupId)
                comment.poll = dto.pollId != nil ? groupPoll(by: dto.pollId!) : nil
                comment.syncState = .synced
            },
            fetch: groupComment(by:)
        )
    }
}
```

Run the `LocalDataSourceTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/LocalDataSource.swift BoardGameToolsTests/Helpers.swift BoardGameToolsTests/LocalDataSourceTests.swift
git commit -m "feat(ios): LocalDataSource with incremental sync apply"
```

### Task 10: RemoteDataSource

**Files:**
- Create: `BoardGameTools/Repositories/RemoteDataSource.swift`
- Test: `BoardGameToolsTests/RemoteDataSourceTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/RemoteDataSourceTests.swift`:
```swift
import Testing
import Foundation
@testable import BoardGameTools

struct RemoteDataSourceTests {
    @Test func syncCallsSyncEndpoint() async throws {
        let apiClient = MockAPIClient()
        apiClient.enqueueResponse(SyncPayload(
            syncedAt: Date(),
            games: EntitySyncPayload(created: [], updated: [], deleted: []),
            sessions: EntitySyncPayload(created: [], updated: [], deleted: []),
            events: EntitySyncPayload(created: [], updated: [], deleted: []),
            dateProposals: EntitySyncPayload(created: [], updated: [], deleted: []),
            groups: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupPolls: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupComments: EntitySyncPayload(created: [], updated: [], deleted: []),
            eventProposals: EntitySyncPayload(created: [], updated: [], deleted: []),
            votes: EntitySyncPayload(created: [], updated: [], deleted: []),
            dateVotes: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupPollVotes: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupMembers: EntitySyncPayload(created: [], updated: [], deleted: [])
        ))
        let remote = RemoteDataSource(apiClient: apiClient)
        let result = try await remote.sync(since: nil)
        #expect(apiClient.endpoints.contains(.sync(since: nil)))
        #expect(result.games.created.isEmpty)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/RemoteDataSourceTests
```
Expected: FAIL with `Cannot find 'RemoteDataSource' in scope`.

- [ ] **Step 2: Implement RemoteDataSource**

Create `BoardGameTools/Repositories/RemoteDataSource.swift`:
```swift
import Foundation

protocol RemoteDataSourceProtocol: Sendable {
    func sync(since: Date?) async throws -> SyncPayload
    func createGame(_ dto: GameWriteDTO) async throws -> GameDTO
    func updateGame(id: String, _ dto: GameWriteDTO) async throws -> GameDTO
    func deleteGame(id: String) async throws
    func createSession(_ dto: SessionWriteDTO) async throws -> SessionDTO
    func updateSession(id: String, _ dto: SessionWriteDTO) async throws -> SessionDTO
    func deleteSession(id: String) async throws
    func createEvent(_ dto: EventWriteDTO) async throws -> EventDTO
    func updateEvent(id: String, _ dto: EventWriteDTO) async throws -> EventDTO
    func deleteEvent(id: String) async throws
    func proposeGame(eventId: String, _ request: CreateProposalRequest) async throws
    func voteEvent(eventId: String, _ request: VoteRequest) async throws
    func dateVoteEvent(eventId: String, _ request: DateVoteRequest) async throws
    func createGroup(_ dto: GroupWriteDTO) async throws -> GroupDTO
    func updateGroup(id: String, _ dto: GroupWriteDTO) async throws -> GroupDTO
    func deleteGroup(id: String) async throws
    func joinGroup(id: String, _ request: JoinGroupRequest) async throws -> GroupDTO
    func createPoll(groupId: String, _ request: CreatePollRequest) async throws
    func votePoll(groupId: String, _ request: PollVoteRequest) async throws
    func commentGroup(groupId: String, _ request: GroupCommentRequest) async throws
    func searchBGG(query: String) async throws -> [BGGSearchResultDTO]
    func lookupBGG(ean: String) async throws -> [BGGSearchResultDTO]
    func importBGG(_ request: BGGImportRequest) async throws -> GameDTO
    func getPublicEvent(token: String) async throws -> EventDTO
    func publicVote(token: String, _ request: PublicVoteRequest) async throws -> EventDTO
}

actor RemoteDataSource: RemoteDataSourceProtocol {
    private let apiClient: any APIClientProtocol

    init(apiClient: any APIClientProtocol) {
        self.apiClient = apiClient
    }

    func sync(since: Date?) async throws -> SyncPayload {
        try await apiClient.request(.sync(since: since))
    }

    func createGame(_ dto: GameWriteDTO) async throws -> GameDTO {
        try await apiClient.request(.createGame, body: dto)
    }

    func updateGame(id: String, _ dto: GameWriteDTO) async throws -> GameDTO {
        try await apiClient.request(.updateGame(id: id), body: dto)
    }

    func deleteGame(id: String) async throws {
        let _: EmptyResponse = try await apiClient.request(.deleteGame(id: id))
    }

    func createSession(_ dto: SessionWriteDTO) async throws -> SessionDTO {
        try await apiClient.request(.createSession, body: dto)
    }

    func updateSession(id: String, _ dto: SessionWriteDTO) async throws -> SessionDTO {
        try await apiClient.request(.updateSession(id: id), body: dto)
    }

    func deleteSession(id: String) async throws {
        let _: EmptyResponse = try await apiClient.request(.deleteSession(id: id))
    }

    func createEvent(_ dto: EventWriteDTO) async throws -> EventDTO {
        try await apiClient.request(.createEvent, body: dto)
    }

    func updateEvent(id: String, _ dto: EventWriteDTO) async throws -> EventDTO {
        try await apiClient.request(.updateEvent(id: id), body: dto)
    }

    func deleteEvent(id: String) async throws {
        let _: EmptyResponse = try await apiClient.request(.deleteEvent(id: id))
    }

    func proposeGame(eventId: String, _ request: CreateProposalRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.proposeGame(eventId: eventId), body: request)
    }

    func voteEvent(eventId: String, _ request: VoteRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.voteEvent(eventId: eventId), body: request)
    }

    func dateVoteEvent(eventId: String, _ request: DateVoteRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.dateVoteEvent(eventId: eventId), body: request)
    }

    func createGroup(_ dto: GroupWriteDTO) async throws -> GroupDTO {
        try await apiClient.request(.createGroup, body: dto)
    }

    func updateGroup(id: String, _ dto: GroupWriteDTO) async throws -> GroupDTO {
        try await apiClient.request(.updateGroup(id: id), body: dto)
    }

    func deleteGroup(id: String) async throws {
        let _: EmptyResponse = try await apiClient.request(.deleteGroup(id: id))
    }

    func joinGroup(id: String, _ request: JoinGroupRequest) async throws -> GroupDTO {
        try await apiClient.request(.joinGroup(id: id), body: request)
    }

    func createPoll(groupId: String, _ request: CreatePollRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.createPoll(groupId: groupId), body: request)
    }

    func votePoll(groupId: String, _ request: PollVoteRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.votePoll(groupId: groupId), body: request)
    }

    func commentGroup(groupId: String, _ request: GroupCommentRequest) async throws {
        let _: EmptyResponse = try await apiClient.request(.commentGroup(groupId: groupId), body: request)
    }

    func searchBGG(query: String) async throws -> [BGGSearchResultDTO] {
        let response: BGGSearchResponse = try await apiClient.request(.bggSearch(query: query))
        return response.results
    }

    func lookupBGG(ean: String) async throws -> [BGGSearchResultDTO] {
        let response: BGGLookupResponse = try await apiClient.request(.bggLookup(ean: ean))
        return response.results
    }

    func importBGG(_ request: BGGImportRequest) async throws -> GameDTO {
        try await apiClient.request(.bggImport, body: request)
    }

    func getPublicEvent(token: String) async throws -> EventDTO {
        try await apiClient.request(.publicEvent(token: token))
    }

    func publicVote(token: String, _ request: PublicVoteRequest) async throws -> EventDTO {
        try await apiClient.request(.publicVote(token: token), body: request)
    }
}
```

Run the `RemoteDataSourceTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/RemoteDataSource.swift BoardGameToolsTests/RemoteDataSourceTests.swift
git commit -m "feat(ios): RemoteDataSource wrapping mobile API endpoints"
```

### Task 11: SyncEngine

**Files:**
- Create: `BoardGameTools/Sync/SyncEngine.swift`
- Test: `BoardGameToolsTests/SyncEngineTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/SyncEngineTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

actor MockRemoteDataSource: RemoteDataSourceProtocol {
    var syncResponse: SyncPayload?

    func sync(since: Date?) async throws -> SyncPayload {
        guard let response = syncResponse else { throw APIError.invalidResponse }
        return response
    }

    func createGame(_ dto: GameWriteDTO) async throws -> GameDTO { throw APIError.invalidResponse }
    func updateGame(id: String, _ dto: GameWriteDTO) async throws -> GameDTO { throw APIError.invalidResponse }
    func deleteGame(id: String) async throws {}
    func createSession(_ dto: SessionWriteDTO) async throws -> SessionDTO { throw APIError.invalidResponse }
    func updateSession(id: String, _ dto: SessionWriteDTO) async throws -> SessionDTO { throw APIError.invalidResponse }
    func deleteSession(id: String) async throws {}
    func createEvent(_ dto: EventWriteDTO) async throws -> EventDTO { throw APIError.invalidResponse }
    func updateEvent(id: String, _ dto: EventWriteDTO) async throws -> EventDTO { throw APIError.invalidResponse }
    func deleteEvent(id: String) async throws {}
    func proposeGame(eventId: String, _ request: CreateProposalRequest) async throws {}
    func voteEvent(eventId: String, _ request: VoteRequest) async throws {}
    func dateVoteEvent(eventId: String, _ request: DateVoteRequest) async throws {}
    func createGroup(_ dto: GroupWriteDTO) async throws -> GroupDTO { throw APIError.invalidResponse }
    func updateGroup(id: String, _ dto: GroupWriteDTO) async throws -> GroupDTO { throw APIError.invalidResponse }
    func deleteGroup(id: String) async throws {}
    func joinGroup(id: String, _ request: JoinGroupRequest) async throws -> GroupDTO { throw APIError.invalidResponse }
    func createPoll(groupId: String, _ request: CreatePollRequest) async throws {}
    func votePoll(groupId: String, _ request: PollVoteRequest) async throws {}
    func commentGroup(groupId: String, _ request: GroupCommentRequest) async throws {}
    func searchBGG(query: String) async throws -> [BGGSearchResultDTO] { [] }
    func lookupBGG(ean: String) async throws -> [BGGSearchResultDTO] { [] }
    func importBGG(_ request: BGGImportRequest) async throws -> GameDTO { throw APIError.invalidResponse }
    func getPublicEvent(token: String) async throws -> EventDTO { throw APIError.invalidResponse }
    func publicVote(token: String, _ request: PublicVoteRequest) async throws -> EventDTO { throw APIError.invalidResponse }
}

struct SyncEngineTests {
    @Test func pullAppliesRemotePayload() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let engine = SyncEngine(local: local, remote: remote)
        remote.syncResponse = SyncPayload(
            syncedAt: Date(),
            games: EntitySyncPayload(created: [GameDTO(id: "g1", name: "Azul", description: nil, minPlayers: 2, maxPlayers: 4, playTimeMinutes: nil, complexity: nil, bggId: nil, ean: nil, imageUrl: nil, ownerId: nil, createdAt: nil, updatedAt: Date(), deletedAt: nil, tagNames: nil)], updated: [], deleted: []),
            sessions: emptySyncPayload(),
            events: emptySyncPayload(),
            dateProposals: emptySyncPayload(),
            groups: emptySyncPayload(),
            groupPolls: emptySyncPayload(),
            groupComments: emptySyncPayload(),
            eventProposals: emptySyncPayload(),
            votes: emptySyncPayload(),
            dateVotes: emptySyncPayload(),
            groupPollVotes: emptySyncPayload(),
            groupMembers: emptySyncPayload()
        )
        try await engine.pull()
        let games = try await local.fetchGames()
        #expect(games.count == 1)
    }

    private func emptySyncPayload<T: Codable & Sendable>() -> EntitySyncPayload<T> {
        EntitySyncPayload(created: [], updated: [], deleted: [])
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/SyncEngineTests
```
Expected: FAIL with `Cannot find 'SyncEngine' in scope`.

- [ ] **Step 2: Implement SyncEngine**

Create `BoardGameTools/Sync/SyncEngine.swift`:
```swift
import Foundation

actor SyncEngine {
    private let local: LocalDataSource
    private let remote: any RemoteDataSourceProtocol
    private var isSyncing = false

    init(local: LocalDataSource, remote: any RemoteDataSourceProtocol) {
        self.local = local
        self.remote = remote
    }

    func pull() async throws {
        guard !isSyncing else { return }
        isSyncing = true
        defer { isSyncing = false }
        let lastSync = await local.lastSyncDate()
        let payload = try await remote.sync(since: lastSync)
        try await local.apply(payload)
        try await local.setLastSyncDate(payload.syncedAt)
    }

    func push() async throws {
        guard !isSyncing else { return }
        isSyncing = true
        defer { isSyncing = false }
        try await pushGames()
        try await pushSessions()
        try await pushEvents()
        try await pushGroups()
        try await pushEventProposals()
        try await pushVotes()
        try await pushDateVotes()
        try await pushGroupPolls()
        try await pushGroupPollVotes()
        try await pushGroupComments()
        try await pull()
    }

    private func pushGames() async throws {
        for game in try await local.pendingGames() {
            let dto = GameWriteDTO(
                id: game.id,
                name: game.name,
                description: game.gameDescription,
                minPlayers: game.minPlayers,
                maxPlayers: game.maxPlayers,
                playTimeMinutes: game.playTimeMinutes,
                complexity: game.complexity,
                bggId: game.bggId,
                ean: game.ean,
                imageUrl: game.imageUrl,
                tagNames: game.tagNames
            )
            switch game.syncState {
            case .pendingCreate:
                _ = try await remote.createGame(dto)
            case .pendingUpdate:
                _ = try await remote.updateGame(id: game.id, dto)
            case .pendingDelete:
                try await remote.deleteGame(id: game.id)
                try await local.delete(game)
                continue
            case .synced:
                continue
            }
            game.syncState = .synced
            try await local.save()
        }
    }

    private func pushSessions() async throws {
        for session in try await local.pendingSessions() {
            let players: [SessionPlayerDTO] = (session.players ?? []).map { player in
                SessionPlayerDTO(
                    id: player.id,
                    userId: player.userId,
                    score: player.score,
                    isWinner: player.isWinner,
                    placement: player.placement
                )
            }
            let dto = SessionWriteDTO(
                id: session.id,
                gameId: session.gameId,
                playedAt: session.playedAt,
                durationMinutes: session.durationMinutes,
                notes: session.notes,
                players: players
            )
            switch session.syncState {
            case .pendingCreate:
                _ = try await remote.createSession(dto)
            case .pendingUpdate:
                _ = try await remote.updateSession(id: session.id, dto)
            case .pendingDelete:
                try await remote.deleteSession(id: session.id)
                try await local.delete(session)
                continue
            case .synced:
                continue
            }
            session.syncState = .synced
            try await local.save()
        }
    }

    private func pushEvents() async throws {
        for event in try await local.pendingEvents() {
            let dto = EventWriteDTO(
                id: event.id,
                title: event.title,
                description: event.eventDescription,
                eventDate: event.eventDate,
                location: event.location,
                groupId: event.groupId
            )
            switch event.syncState {
            case .pendingCreate:
                _ = try await remote.createEvent(dto)
            case .pendingUpdate:
                _ = try await remote.updateEvent(id: event.id, dto)
            case .pendingDelete:
                try await remote.deleteEvent(id: event.id)
                try await local.delete(event)
                continue
            case .synced:
                continue
            }
            event.syncState = .synced
            try await local.save()
        }
    }

    private func pushGroups() async throws {
        for group in try await local.pendingGroups() {
            let dto = GroupWriteDTO(id: group.id, name: group.name, description: group.groupDescription)
            switch group.syncState {
            case .pendingCreate:
                _ = try await remote.createGroup(dto)
            case .pendingUpdate:
                _ = try await remote.updateGroup(id: group.id, dto)
            case .pendingDelete:
                try await remote.deleteGroup(id: group.id)
                try await local.delete(group)
                continue
            case .synced:
                continue
            }
            group.syncState = .synced
            try await local.save()
        }
    }

    private func pushEventProposals() async throws {
        for proposal in try await local.pendingEventProposals() {
            let request = CreateProposalRequest(
                gameId: proposal.gameId,
                bggId: proposal.bggId,
                bggName: proposal.bggName,
                bggImageUrl: proposal.bggImageUrl,
                bggMinPlayers: proposal.bggMinPlayers,
                bggMaxPlayers: proposal.bggMaxPlayers,
                bggPlayTimeMinutes: proposal.bggPlayTimeMinutes
            )
            try await remote.proposeGame(eventId: proposal.eventId, request)
            proposal.syncState = .synced
            try await local.save()
        }
    }

    private func pushVotes() async throws {
        for vote in try await local.pendingVotes() {
            try await remote.voteEvent(eventId: vote.proposal?.eventId ?? "", VoteRequest(proposalId: vote.proposalId))
            vote.syncState = .synced
            try await local.save()
        }
    }

    private func pushDateVotes() async throws {
        for vote in try await local.pendingDateVotes() {
            try await remote.dateVoteEvent(eventId: vote.dateProposal?.eventId ?? "", DateVoteRequest(dateProposalId: vote.dateProposalId, availability: vote.availability))
            vote.syncState = .synced
            try await local.save()
        }
    }

    private func pushGroupPolls() async throws {
        for poll in try await local.pendingGroupPolls() {
            let options = (poll.options ?? []).map { $0.text }
            let request = CreatePollRequest(title: poll.title, description: poll.pollDescription, type: poll.type, options: options)
            try await remote.createPoll(groupId: poll.groupId, request)
            poll.syncState = .synced
            try await local.save()
        }
    }

    private func pushGroupPollVotes() async throws {
        for vote in try await local.pendingGroupPollVotes() {
            try await remote.votePoll(groupId: vote.option?.poll?.groupId ?? "", PollVoteRequest(optionId: vote.optionId))
            vote.syncState = .synced
            try await local.save()
        }
    }

    private func pushGroupComments() async throws {
        for comment in try await local.pendingGroupComments() {
            let request = GroupCommentRequest(pollId: comment.pollId, content: comment.content)
            try await remote.commentGroup(groupId: comment.groupId, request)
            comment.syncState = .synced
            try await local.save()
        }
    }
}
```

Run the `SyncEngineTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Sync/SyncEngine.swift BoardGameToolsTests/SyncEngineTests.swift
git commit -m "feat(ios): SyncEngine pull/push for offline-first sync"
```

### Task 12: GameRepository

**Files:**
- Create: `BoardGameTools/Repositories/GameRepository.swift`
- Create: `BoardGameToolsTests/MockRemoteDataSource.swift` (shared test helper)
- Create: `BoardGameToolsTests/GameRepositoryTests.swift`
- Modify: `BoardGameToolsTests/SyncEngineTests.swift` (remove local mock, use shared helper)

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/MockRemoteDataSource.swift`:
```swift
import Foundation
import SwiftData
@testable import BoardGameTools

actor MockRemoteDataSource: RemoteDataSourceProtocol {
    var syncResponse: SyncPayload?
    var lastCreatedGame: GameWriteDTO?
    var lastUpdatedGame: (String, GameWriteDTO)?
    var deletedGameId: String?
    var syncCallCount = 0

    func sync(since: Date?) async throws -> SyncPayload {
        syncCallCount += 1
        return syncResponse ?? SyncPayload(
            syncedAt: Date(),
            games: EntitySyncPayload(created: [], updated: [], deleted: []),
            sessions: EntitySyncPayload(created: [], updated: [], deleted: []),
            events: EntitySyncPayload(created: [], updated: [], deleted: []),
            dateProposals: EntitySyncPayload(created: [], updated: [], deleted: []),
            groups: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupPolls: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupComments: EntitySyncPayload(created: [], updated: [], deleted: []),
            eventProposals: EntitySyncPayload(created: [], updated: [], deleted: []),
            votes: EntitySyncPayload(created: [], updated: [], deleted: []),
            dateVotes: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupPollVotes: EntitySyncPayload(created: [], updated: [], deleted: []),
            groupMembers: EntitySyncPayload(created: [], updated: [], deleted: [])
        )
    }

    func createGame(_ dto: GameWriteDTO) async throws -> GameDTO {
        lastCreatedGame = dto
        return GameDTO(
            id: dto.id ?? "server-id",
            name: dto.name,
            description: dto.description,
            minPlayers: dto.minPlayers ?? 1,
            maxPlayers: dto.maxPlayers ?? 4,
            playTimeMinutes: dto.playTimeMinutes,
            complexity: dto.complexity,
            bggId: dto.bggId,
            ean: dto.ean,
            imageUrl: dto.imageUrl,
            ownerId: nil,
            createdAt: nil,
            updatedAt: Date(),
            deletedAt: nil,
            tagNames: dto.tagNames
        )
    }

    func updateGame(id: String, _ dto: GameWriteDTO) async throws -> GameDTO {
        lastUpdatedGame = (id, dto)
        return try await createGame(dto)
    }

    func deleteGame(id: String) async throws { deletedGameId = id }

    func createSession(_ dto: SessionWriteDTO) async throws -> SessionDTO { throw APIError.invalidResponse }
    func updateSession(id: String, _ dto: SessionWriteDTO) async throws -> SessionDTO { throw APIError.invalidResponse }
    func deleteSession(id: String) async throws {}
    func createEvent(_ dto: EventWriteDTO) async throws -> EventDTO { throw APIError.invalidResponse }
    func updateEvent(id: String, _ dto: EventWriteDTO) async throws -> EventDTO { throw APIError.invalidResponse }
    func deleteEvent(id: String) async throws {}
    func proposeGame(eventId: String, _ request: CreateProposalRequest) async throws {}
    func voteEvent(eventId: String, _ request: VoteRequest) async throws {}
    func dateVoteEvent(eventId: String, _ request: DateVoteRequest) async throws {}
    func createGroup(_ dto: GroupWriteDTO) async throws -> GroupDTO { throw APIError.invalidResponse }
    func updateGroup(id: String, _ dto: GroupWriteDTO) async throws -> GroupDTO { throw APIError.invalidResponse }
    func deleteGroup(id: String) async throws {}
    func joinGroup(id: String, _ request: JoinGroupRequest) async throws -> GroupDTO { throw APIError.invalidResponse }
    func createPoll(groupId: String, _ request: CreatePollRequest) async throws {}
    func votePoll(groupId: String, _ request: PollVoteRequest) async throws {}
    func commentGroup(groupId: String, _ request: GroupCommentRequest) async throws {}
    func searchBGG(query: String) async throws -> [BGGSearchResultDTO] { [] }
    func lookupBGG(ean: String) async throws -> [BGGSearchResultDTO] { [] }
    func importBGG(_ request: BGGImportRequest) async throws -> GameDTO { throw APIError.invalidResponse }
    func getPublicEvent(token: String) async throws -> EventDTO { throw APIError.invalidResponse }
    func publicVote(token: String, _ request: PublicVoteRequest) async throws -> EventDTO { throw APIError.invalidResponse }
}
```

Create `BoardGameToolsTests/GameRepositoryTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct GameRepositoryTests {
    private func makeRepo() async throws -> (GameRepository, LocalDataSource, MockRemoteDataSource, SyncEngine) {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let syncEngine = SyncEngine(local: local, remote: remote)
        let repo = GameRepository(local: local, remote: remote, syncEngine: syncEngine)
        return (repo, local, remote, syncEngine)
    }

    @Test func createGameMarksPendingCreate() async throws {
        let (repo, local, _, _) = try await makeRepo()
        let game = try await repo.create(name: "Azul")
        #expect(game.syncState == .pendingCreate)
        let pending = try await local.pendingGames()
        #expect(pending.count == 1)
    }

    @Test func updateGameMarksPendingUpdate() async throws {
        let (repo, local, _, _) = try await makeRepo()
        let game = try await repo.create(name: "Azul")
        try await local.save() // simulate already persisted
        let updated = try await repo.update(id: game.id, name: "Azul Neu")
        #expect(updated.syncState == .pendingUpdate)
        #expect(updated.name == "Azul Neu")
    }
}
```

Before running, open `BoardGameToolsTests/SyncEngineTests.swift` and delete the local `actor MockRemoteDataSource` definition so the test module uses the shared helper created above. The test body can stay unchanged.

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/GameRepositoryTests
```
Expected: FAIL with `Cannot find 'GameRepository' in scope`.

- [ ] **Step 2: Implement GameRepository**

Create `BoardGameTools/Repositories/GameRepository.swift`:
```swift
import Foundation

protocol GameRepositoryProtocol: Sendable {
    func list() async throws -> [LocalGame]
    func get(id: String) async throws -> LocalGame?
    func create(
        name: String,
        description: String?,
        minPlayers: Int?,
        maxPlayers: Int?,
        playTimeMinutes: Int?,
        complexity: Int?,
        bggId: String?,
        ean: String?,
        imageUrl: String?,
        tagNames: [String]?
    ) async throws -> LocalGame
    func update(
        id: String,
        name: String?,
        description: String?,
        minPlayers: Int?,
        maxPlayers: Int?,
        playTimeMinutes: Int?,
        complexity: Int?,
        bggId: String?,
        ean: String?,
        imageUrl: String?,
        tagNames: [String]?
    ) async throws -> LocalGame
    func delete(id: String) async throws
    func importFromBGG(bggId: String) async throws -> LocalGame
}

actor GameRepository: GameRepositoryProtocol {
    private let local: LocalDataSource
    private let remote: any RemoteDataSourceProtocol
    private let syncEngine: SyncEngine

    init(local: LocalDataSource, remote: any RemoteDataSourceProtocol, syncEngine: SyncEngine) {
        self.local = local
        self.remote = remote
        self.syncEngine = syncEngine
    }

    func list() async throws -> [LocalGame] {
        let cached = try await local.fetchGames()
        Task { try await syncEngine.pull() }
        return cached
    }

    func get(id: String) async throws -> LocalGame? {
        try await local.fetchGame(id: id)
    }

    func create(
        name: String,
        description: String? = nil,
        minPlayers: Int? = nil,
        maxPlayers: Int? = nil,
        playTimeMinutes: Int? = nil,
        complexity: Int? = nil,
        bggId: String? = nil,
        ean: String? = nil,
        imageUrl: String? = nil,
        tagNames: [String]? = nil
    ) async throws -> LocalGame {
        let game = LocalGame(
            id: UUID().uuidString,
            name: name,
            gameDescription: description,
            minPlayers: minPlayers ?? 1,
            maxPlayers: maxPlayers ?? 4,
            playTimeMinutes: playTimeMinutes,
            complexity: complexity,
            bggId: bggId,
            ean: ean,
            imageUrl: imageUrl,
            tagNames: tagNames,
            updatedAt: Date(),
            syncState: .pendingCreate
        )
        try await local.insert(game)
        Task { try await syncEngine.push() }
        return game
    }

    func update(
        id: String,
        name: String? = nil,
        description: String? = nil,
        minPlayers: Int? = nil,
        maxPlayers: Int? = nil,
        playTimeMinutes: Int? = nil,
        complexity: Int? = nil,
        bggId: String? = nil,
        ean: String? = nil,
        imageUrl: String? = nil,
        tagNames: [String]? = nil
    ) async throws -> LocalGame {
        guard let game = try await local.fetchGame(id: id) else { throw APIError.notFound }
        if let name { game.name = name }
        if let description { game.gameDescription = description }
        if let minPlayers { game.minPlayers = minPlayers }
        if let maxPlayers { game.maxPlayers = maxPlayers }
        if let playTimeMinutes { game.playTimeMinutes = playTimeMinutes }
        if let complexity { game.complexity = complexity }
        if let bggId { game.bggId = bggId }
        if let ean { game.ean = ean }
        if let imageUrl { game.imageUrl = imageUrl }
        if let tagNames { game.tagNames = tagNames }
        game.updatedAt = Date()
        game.syncState = .pendingUpdate
        try await local.save()
        Task { try await syncEngine.push() }
        return game
    }

    func delete(id: String) async throws {
        guard let game = try await local.fetchGame(id: id) else { throw APIError.notFound }
        game.syncState = .pendingDelete
        try await local.save()
        Task { try await syncEngine.push() }
    }

    func importFromBGG(bggId: String) async throws -> LocalGame {
        let dto = try await remote.importBGG(BGGImportRequest(bggId: bggId))
        let game = LocalGame(
            id: dto.id,
            name: dto.name,
            gameDescription: dto.description,
            minPlayers: dto.minPlayers,
            maxPlayers: dto.maxPlayers,
            playTimeMinutes: dto.playTimeMinutes,
            complexity: dto.complexity,
            bggId: dto.bggId,
            ean: dto.ean,
            imageUrl: dto.imageUrl,
            tagNames: dto.tagNames,
            updatedAt: dto.updatedAt ?? Date(),
            syncState: .synced
        )
        try await local.insert(game)
        return game
    }
}
```

Run the `GameRepositoryTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/GameRepository.swift BoardGameToolsTests/MockRemoteDataSource.swift BoardGameToolsTests/GameRepositoryTests.swift BoardGameToolsTests/SyncEngineTests.swift
git commit -m "feat(ios): GameRepository with offline-first CRUD and BGG import"
```

### Task 13: SessionRepository

**Files:**
- Create: `BoardGameTools/Repositories/SessionRepository.swift`
- Modify: `BoardGameToolsTests/MockRemoteDataSource.swift` (add session methods)
- Create: `BoardGameToolsTests/SessionRepositoryTests.swift`

- [ ] **Step 1: Write the failing test**

In `BoardGameToolsTests/MockRemoteDataSource.swift`, replace the session stubs with:
```swift
    var lastCreatedSession: SessionWriteDTO?
    var deletedSessionId: String?

    func createSession(_ dto: SessionWriteDTO) async throws -> SessionDTO {
        lastCreatedSession = dto
        return SessionDTO(
            id: dto.id ?? "s1",
            gameId: dto.gameId,
            playedAt: dto.playedAt,
            durationMinutes: dto.durationMinutes,
            notes: dto.notes,
            players: dto.players,
            createdAt: Date(),
            updatedAt: Date(),
            deletedAt: nil
        )
    }

    func updateSession(id: String, _ dto: SessionWriteDTO) async throws -> SessionDTO {
        _ = try await createSession(dto)
        return try await createSession(dto)
    }

    func deleteSession(id: String) async throws { deletedSessionId = id }
```

Create `BoardGameToolsTests/SessionRepositoryTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct SessionRepositoryTests {
    private func makeRepo() async throws -> (SessionRepository, LocalDataSource) {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let syncEngine = SyncEngine(local: local, remote: remote)
        let repo = SessionRepository(local: local, remote: remote, syncEngine: syncEngine)
        return (repo, local)
    }

    @Test func createSessionMarksPendingCreate() async throws {
        let (repo, local) = try await makeRepo()
        let player = SessionPlayerInput(userId: "u1", score: 10, isWinner: true, placement: 1)
        let session = try await repo.create(gameId: "g1", playedAt: Date(), durationMinutes: 60, notes: nil, players: [player])
        #expect(session.syncState == .pendingCreate)
        let pending = try await local.pendingSessions()
        #expect(pending.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/SessionRepositoryTests
```
Expected: FAIL with `Cannot find 'SessionRepository' in scope`.

- [ ] **Step 2: Implement SessionRepository**

Create `BoardGameTools/Repositories/SessionRepository.swift`:
```swift
import Foundation

struct SessionPlayerInput: Sendable {
    let userId: String
    let score: Int?
    let isWinner: Bool
    let placement: Int?
}

protocol SessionRepositoryProtocol: Sendable {
    func list() async throws -> [LocalSession]
    func get(id: String) async throws -> LocalSession?
    func create(gameId: String, playedAt: Date, durationMinutes: Int?, notes: String?, players: [SessionPlayerInput]) async throws -> LocalSession
    func update(id: String, playedAt: Date?, durationMinutes: Int?, notes: String?, players: [SessionPlayerInput]?) async throws -> LocalSession
    func delete(id: String) async throws
}

actor SessionRepository: SessionRepositoryProtocol {
    private let local: LocalDataSource
    private let remote: any RemoteDataSourceProtocol
    private let syncEngine: SyncEngine

    init(local: LocalDataSource, remote: any RemoteDataSourceProtocol, syncEngine: SyncEngine) {
        self.local = local
        self.remote = remote
        self.syncEngine = syncEngine
    }

    func list() async throws -> [LocalSession] {
        let cached = try await local.fetchSessions()
        Task { try await syncEngine.pull() }
        return cached
    }

    func get(id: String) async throws -> LocalSession? {
        try await local.fetchSession(id: id)
    }

    func create(gameId: String, playedAt: Date, durationMinutes: Int? = nil, notes: String? = nil, players: [SessionPlayerInput]) async throws -> LocalSession {
        let session = LocalSession(
            id: UUID().uuidString,
            gameId: gameId,
            playedAt: playedAt,
            durationMinutes: durationMinutes,
            notes: notes,
            updatedAt: Date(),
            syncState: .pendingCreate
        )
        try await local.insert(session)
        for input in players {
            let player = LocalSessionPlayer(
                id: UUID().uuidString,
                sessionId: session.id,
                userId: input.userId,
                score: input.score,
                isWinner: input.isWinner,
                placement: input.placement,
                syncState: .pendingCreate
            )
            player.session = session
            try await local.insert(player)
        }
        Task { try await syncEngine.push() }
        return session
    }

    func update(id: String, playedAt: Date? = nil, durationMinutes: Int? = nil, notes: String? = nil, players: [SessionPlayerInput]? = nil) async throws -> LocalSession {
        guard let session = try await local.fetchSession(id: id) else { throw APIError.notFound }
        if let playedAt { session.playedAt = playedAt }
        if let durationMinutes { session.durationMinutes = durationMinutes }
        if let notes { session.notes = notes }
        if let players {
            if let existing = session.players {
                for player in existing { try await local.delete(player) }
            }
            for input in players {
                let player = LocalSessionPlayer(
                    id: UUID().uuidString,
                    sessionId: session.id,
                    userId: input.userId,
                    score: input.score,
                    isWinner: input.isWinner,
                    placement: input.placement,
                    syncState: .pendingUpdate
                )
                player.session = session
                try await local.insert(player)
            }
        }
        session.updatedAt = Date()
        session.syncState = .pendingUpdate
        try await local.save()
        Task { try await syncEngine.push() }
        return session
    }

    func delete(id: String) async throws {
        guard let session = try await local.fetchSession(id: id) else { throw APIError.notFound }
        session.syncState = .pendingDelete
        try await local.save()
        Task { try await syncEngine.push() }
    }
}
```

Run the `SessionRepositoryTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/SessionRepository.swift BoardGameToolsTests/MockRemoteDataSource.swift BoardGameToolsTests/SessionRepositoryTests.swift
git commit -m "feat(ios): SessionRepository with player tracking"
```

### Task 14: EventRepository

**Files:**
- Create: `BoardGameTools/Repositories/EventRepository.swift`
- Modify: `BoardGameToolsTests/MockRemoteDataSource.swift` (add event methods)
- Create: `BoardGameToolsTests/EventRepositoryTests.swift`

- [ ] **Step 1: Write the failing test**

In `BoardGameToolsTests/MockRemoteDataSource.swift`, replace the event stubs with:
```swift
    var lastCreatedEvent: EventWriteDTO?
    var lastProposalRequest: (String, CreateProposalRequest)?
    var lastVoteRequest: (String, VoteRequest)?
    var deletedEventId: String?

    func createEvent(_ dto: EventWriteDTO) async throws -> EventDTO {
        lastCreatedEvent = dto
        return EventDTO(
            id: dto.id ?? "e1",
            title: dto.title,
            description: dto.description,
            eventDate: dto.eventDate,
            location: dto.location,
            status: "draft",
            groupId: dto.groupId,
            selectedGameId: nil,
            winningProposalId: nil,
            isPublic: false,
            shareToken: nil,
            proposals: nil,
            dateProposals: nil,
            createdAt: Date(),
            updatedAt: Date(),
            deletedAt: nil
        )
    }

    func updateEvent(id: String, _ dto: EventWriteDTO) async throws -> EventDTO {
        _ = try await createEvent(dto)
        return try await createEvent(dto)
    }

    func deleteEvent(id: String) async throws { deletedEventId = id }

    func proposeGame(eventId: String, _ request: CreateProposalRequest) async throws {
        lastProposalRequest = (eventId, request)
    }

    func voteEvent(eventId: String, _ request: VoteRequest) async throws {
        lastVoteRequest = (eventId, request)
    }

    func dateVoteEvent(eventId: String, _ request: DateVoteRequest) async throws {}
```

Create `BoardGameToolsTests/EventRepositoryTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct EventRepositoryTests {
    private func makeRepo() async throws -> (EventRepository, LocalDataSource) {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let syncEngine = SyncEngine(local: local, remote: remote)
        let repo = EventRepository(local: local, remote: remote, syncEngine: syncEngine)
        return (repo, local)
    }

    @Test func createEventMarksPendingCreate() async throws {
        let (repo, local) = try await makeRepo()
        let event = try await repo.create(title: "Spieleabend", eventDate: Date())
        #expect(event.syncState == .pendingCreate)
        let pending = try await local.pendingEvents()
        #expect(pending.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/EventRepositoryTests
```
Expected: FAIL with `Cannot find 'EventRepository' in scope`.

- [ ] **Step 2: Implement EventRepository**

Create `BoardGameTools/Repositories/EventRepository.swift`:
```swift
import Foundation

protocol EventRepositoryProtocol: Sendable {
    func list() async throws -> [LocalEvent]
    func get(id: String) async throws -> LocalEvent?
    func create(title: String, description: String?, eventDate: Date, location: String?, groupId: String?) async throws -> LocalEvent
    func update(id: String, title: String?, description: String?, eventDate: Date?, location: String?, groupId: String?) async throws -> LocalEvent
    func delete(id: String) async throws
    func proposeGame(eventId: String, gameId: String?, bggId: String?, bggName: String?, bggImageUrl: String?, bggMinPlayers: Int?, bggMaxPlayers: Int?, bggPlayTimeMinutes: Int?) async throws
    func vote(eventId: String, proposalId: String) async throws
    func dateVote(eventId: String, dateProposalId: String, availability: String) async throws
}

actor EventRepository: EventRepositoryProtocol {
    private let local: LocalDataSource
    private let remote: any RemoteDataSourceProtocol
    private let syncEngine: SyncEngine

    init(local: LocalDataSource, remote: any RemoteDataSourceProtocol, syncEngine: SyncEngine) {
        self.local = local
        self.remote = remote
        self.syncEngine = syncEngine
    }

    func list() async throws -> [LocalEvent] {
        let cached = try await local.fetchEvents()
        Task { try await syncEngine.pull() }
        return cached
    }

    func get(id: String) async throws -> LocalEvent? {
        try await local.fetchEvent(id: id)
    }

    func create(title: String, description: String? = nil, eventDate: Date, location: String? = nil, groupId: String? = nil) async throws -> LocalEvent {
        let event = LocalEvent(
            id: UUID().uuidString,
            title: title,
            eventDescription: description,
            eventDate: eventDate,
            location: location,
            groupId: groupId,
            updatedAt: Date(),
            syncState: .pendingCreate
        )
        try await local.insert(event)
        Task { try await syncEngine.push() }
        return event
    }

    func update(id: String, title: String? = nil, description: String? = nil, eventDate: Date? = nil, location: String? = nil, groupId: String? = nil) async throws -> LocalEvent {
        guard let event = try await local.fetchEvent(id: id) else { throw APIError.notFound }
        if let title { event.title = title }
        if let description { event.eventDescription = description }
        if let eventDate { event.eventDate = eventDate }
        if let location { event.location = location }
        if let groupId { event.groupId = groupId }
        event.updatedAt = Date()
        event.syncState = .pendingUpdate
        try await local.save()
        Task { try await syncEngine.push() }
        return event
    }

    func delete(id: String) async throws {
        guard let event = try await local.fetchEvent(id: id) else { throw APIError.notFound }
        event.syncState = .pendingDelete
        try await local.save()
        Task { try await syncEngine.push() }
    }

    func proposeGame(eventId: String, gameId: String? = nil, bggId: String? = nil, bggName: String? = nil, bggImageUrl: String? = nil, bggMinPlayers: Int? = nil, bggMaxPlayers: Int? = nil, bggPlayTimeMinutes: Int? = nil) async throws {
        guard let event = try await local.fetchEvent(id: eventId) else { throw APIError.notFound }
        let proposal = LocalEventProposal(
            id: UUID().uuidString,
            eventId: eventId,
            gameId: gameId,
            bggId: bggId,
            bggName: bggName,
            bggImageUrl: bggImageUrl,
            bggMinPlayers: bggMinPlayers,
            bggMaxPlayers: bggMaxPlayers,
            bggPlayTimeMinutes: bggPlayTimeMinutes,
            syncState: .pendingCreate
        )
        proposal.event = event
        try await local.insert(proposal)
        Task { try await syncEngine.push() }
    }

    func vote(eventId: String, proposalId: String) async throws {
        guard let proposal = try await local.fetchEvent(id: eventId)?.proposals?.first(where: { $0.id == proposalId }) else { throw APIError.notFound }
        let vote = LocalVote(
            id: UUID().uuidString,
            proposalId: proposalId,
            userId: "current-user",
            syncState: .pendingCreate
        )
        vote.proposal = proposal
        try await local.insert(vote)
        Task { try await syncEngine.push() }
    }

    func dateVote(eventId: String, dateProposalId: String, availability: String) async throws {
        guard let proposal = try await local.fetchEvent(id: eventId)?.dateProposals?.first(where: { $0.id == dateProposalId }) else { throw APIError.notFound }
        let vote = LocalDateVote(
            id: UUID().uuidString,
            dateProposalId: dateProposalId,
            userId: "current-user",
            availability: availability,
            syncState: .pendingCreate
        )
        vote.dateProposal = proposal
        try await local.insert(vote)
        Task { try await syncEngine.push() }
    }
}
```

Run the `EventRepositoryTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/EventRepository.swift BoardGameToolsTests/MockRemoteDataSource.swift BoardGameToolsTests/EventRepositoryTests.swift
git commit -m "feat(ios): EventRepository with proposals and voting"
```

### Task 15: GroupRepository

**Files:**
- Create: `BoardGameTools/Repositories/GroupRepository.swift`
- Modify: `BoardGameToolsTests/MockRemoteDataSource.swift` (add group methods)
- Create: `BoardGameToolsTests/GroupRepositoryTests.swift`

- [ ] **Step 1: Write the failing test**

In `BoardGameToolsTests/MockRemoteDataSource.swift`, replace the group stubs with:
```swift
    var lastCreatedGroup: GroupWriteDTO?
    var lastJoinRequest: (String, JoinGroupRequest)?
    var lastPollRequest: (String, CreatePollRequest)?
    var lastPollVoteRequest: (String, PollVoteRequest)?
    var lastCommentRequest: (String, GroupCommentRequest)?
    var deletedGroupId: String?

    func createGroup(_ dto: GroupWriteDTO) async throws -> GroupDTO {
        lastCreatedGroup = dto
        return GroupDTO(
            id: dto.id ?? "gr1",
            name: dto.name,
            description: dto.description,
            ownerId: "u1",
            isPublic: false,
            shareToken: nil,
            members: nil,
            events: nil,
            polls: nil,
            comments: nil,
            createdAt: Date(),
            updatedAt: Date(),
            deletedAt: nil
        )
    }

    func updateGroup(id: String, _ dto: GroupWriteDTO) async throws -> GroupDTO {
        _ = try await createGroup(dto)
        return try await createGroup(dto)
    }

    func deleteGroup(id: String) async throws { deletedGroupId = id }

    func joinGroup(id: String, _ request: JoinGroupRequest) async throws -> GroupDTO {
        lastJoinRequest = (id, request)
        return try await createGroup(GroupWriteDTO(id: nil, name: "Joined", description: nil))
    }

    func createPoll(groupId: String, _ request: CreatePollRequest) async throws {
        lastPollRequest = (groupId, request)
    }

    func votePoll(groupId: String, _ request: PollVoteRequest) async throws {
        lastPollVoteRequest = (groupId, request)
    }

    func commentGroup(groupId: String, _ request: GroupCommentRequest) async throws {
        lastCommentRequest = (groupId, request)
    }
```

Create `BoardGameToolsTests/GroupRepositoryTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct GroupRepositoryTests {
    private func makeRepo() async throws -> (GroupRepository, LocalDataSource) {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let syncEngine = SyncEngine(local: local, remote: remote)
        let repo = GroupRepository(local: local, remote: remote, syncEngine: syncEngine)
        return (repo, local)
    }

    @Test func createGroupMarksPendingCreate() async throws {
        let (repo, local) = try await makeRepo()
        let group = try await repo.create(name: "Freitagsrunde")
        #expect(group.syncState == .pendingCreate)
        let pending = try await local.pendingGroups()
        #expect(pending.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/GroupRepositoryTests
```
Expected: FAIL with `Cannot find 'GroupRepository' in scope`.

- [ ] **Step 2: Implement GroupRepository**

Create `BoardGameTools/Repositories/GroupRepository.swift`:
```swift
import Foundation

protocol GroupRepositoryProtocol: Sendable {
    func list() async throws -> [LocalGroup]
    func get(id: String) async throws -> LocalGroup?
    func create(name: String, description: String?) async throws -> LocalGroup
    func update(id: String, name: String?, description: String?) async throws -> LocalGroup
    func delete(id: String) async throws
    func join(id: String, shareToken: String?) async throws
    func createPoll(groupId: String, title: String, description: String?, type: String, options: [String]) async throws
    func votePoll(groupId: String, optionId: String) async throws
    func addComment(groupId: String, pollId: String?, content: String) async throws
}

actor GroupRepository: GroupRepositoryProtocol {
    private let local: LocalDataSource
    private let remote: any RemoteDataSourceProtocol
    private let syncEngine: SyncEngine

    init(local: LocalDataSource, remote: any RemoteDataSourceProtocol, syncEngine: SyncEngine) {
        self.local = local
        self.remote = remote
        self.syncEngine = syncEngine
    }

    func list() async throws -> [LocalGroup] {
        let cached = try await local.fetchGroups()
        Task { try await syncEngine.pull() }
        return cached
    }

    func get(id: String) async throws -> LocalGroup? {
        try await local.fetchGroup(id: id)
    }

    func create(name: String, description: String? = nil) async throws -> LocalGroup {
        let group = LocalGroup(
            id: UUID().uuidString,
            name: name,
            groupDescription: description,
            ownerId: "current-user",
            updatedAt: Date(),
            syncState: .pendingCreate
        )
        try await local.insert(group)
        Task { try await syncEngine.push() }
        return group
    }

    func update(id: String, name: String? = nil, description: String? = nil) async throws -> LocalGroup {
        guard let group = try await local.fetchGroup(id: id) else { throw APIError.notFound }
        if let name { group.name = name }
        if let description { group.groupDescription = description }
        group.updatedAt = Date()
        group.syncState = .pendingUpdate
        try await local.save()
        Task { try await syncEngine.push() }
        return group
    }

    func delete(id: String) async throws {
        guard let group = try await local.fetchGroup(id: id) else { throw APIError.notFound }
        group.syncState = .pendingDelete
        try await local.save()
        Task { try await syncEngine.push() }
    }

    func join(id: String, shareToken: String? = nil) async throws {
        _ = try await remote.joinGroup(id: id, JoinGroupRequest(shareToken: shareToken))
        Task { try await syncEngine.pull() }
    }

    func createPoll(groupId: String, title: String, description: String? = nil, type: String, options: [String]) async throws {
        let poll = LocalGroupPoll(
            id: UUID().uuidString,
            groupId: groupId,
            title: title,
            pollDescription: description,
            type: type,
            createdById: "current-user",
            syncState: .pendingCreate
        )
        if let group = try await local.fetchGroup(id: groupId) {
            poll.group = group
        }
        try await local.insert(poll)
        for (index, text) in options.enumerated() {
            let option = LocalGroupPollOption(
                id: UUID().uuidString,
                pollId: poll.id,
                text: text,
                sortOrder: index,
                syncState: .pendingCreate
            )
            option.poll = poll
            try await local.insert(option)
        }
        Task { try await syncEngine.push() }
    }

    func votePoll(groupId: String, optionId: String) async throws {
        let vote = LocalGroupPollVote(
            id: UUID().uuidString,
            optionId: optionId,
            voterName: "current-user",
            syncState: .pendingCreate
        )
        try await local.insert(vote)
        Task { try await syncEngine.push() }
    }

    func addComment(groupId: String, pollId: String? = nil, content: String) async throws {
        let comment = LocalGroupComment(
            id: UUID().uuidString,
            groupId: groupId,
            pollId: pollId,
            authorName: "current-user",
            content: content,
            syncState: .pendingCreate
        )
        if let group = try await local.fetchGroup(id: groupId) {
            comment.group = group
        }
        try await local.insert(comment)
        Task { try await syncEngine.push() }
    }
}
```

Run the `GroupRepositoryTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Repositories/GroupRepository.swift BoardGameToolsTests/MockRemoteDataSource.swift BoardGameToolsTests/GroupRepositoryTests.swift
git commit -m "feat(ios): GroupRepository with polls, votes and comments"
```

### Task 16: NotificationManager, DeepLinkHandler and NetworkMonitor

**Files:**
- Create: `BoardGameTools/Services/NotificationManager.swift`
- Create: `BoardGameTools/Services/DeepLinkHandler.swift`
- Create: `BoardGameTools/Services/NetworkMonitor.swift`
- Create: `BoardGameTools/AppDelegate.swift`
- Create: `BoardGameTools/Features/Events/PublicEventView.swift`
- Test: `BoardGameToolsTests/DeepLinkHandlerTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/DeepLinkHandlerTests.swift`:
```swift
import Testing
@testable import BoardGameTools

struct DeepLinkHandlerTests {
    @Test @MainActor func publicEventURLIsParsed() {
        let handler = DeepLinkHandler()
        handler.handle(url: URL(string: "https://boardgametools.vercel.app/public/event/abc123")!)
        #expect(handler.pendingRoute == .publicEvent(token: "abc123"))
    }

    @Test @MainActor func customURLSchemeIsParsed() {
        let handler = DeepLinkHandler()
        handler.handle(url: URL(string: "boardgametools://public/event/xyz")!)
        #expect(handler.pendingRoute == .publicEvent(token: "xyz"))
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/DeepLinkHandlerTests
```
Expected: FAIL with `Cannot find 'DeepLinkHandler' in scope`.

- [ ] **Step 2: Implement the services**

Create `BoardGameTools/Services/NotificationManager.swift`:
```swift
import Foundation
import UserNotifications
import Observation
import UIKit

extension Notification.Name {
    static let deviceTokenReceived = Notification.Name("deviceTokenReceived")
}

@Observable
@MainActor
final class NotificationManager {
    private let apiClient: any APIClientProtocol
    private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    private var observer: NSObjectProtocol?

    init(apiClient: any APIClientProtocol) {
        self.apiClient = apiClient
        self.observer = NotificationCenter.default.addObserver(
            forName: .deviceTokenReceived,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let data = notification.object as? Data else { return }
            Task { [weak self] in
                try? await self?.registerDeviceToken(data)
            }
        }
    }

    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
    }

    func requestAuthorization() async throws {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
        authorizationStatus = granted ? .authorized : .denied
    }

    func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    func registerDeviceToken(_ token: Data) async throws {
        let hex = token.map { String(format: "%02.2hhx", $0) }.joined()
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
        let locale = Locale.current.identifier
        let request = DeviceTokenRequest(deviceToken: hex, platform: "ios", appVersion: appVersion, locale: locale)
        let _: EmptyResponse = try await apiClient.request(.registerDevice, body: request)
    }
}
```

Create `BoardGameTools/Services/DeepLinkHandler.swift`:
```swift
import Foundation
import Observation

enum DeepLinkRoute: Hashable, Sendable {
    case publicEvent(token: String)
    case game(id: String)
    case event(id: String)
    case group(id: String)
}

@Observable
@MainActor
final class DeepLinkHandler {
    private(set) var pendingRoute: DeepLinkRoute?

    func handle(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else { return }
        let path = components.path

        if url.scheme == "boardgametools" && components.host == "public" && path.hasPrefix("/event/") {
            let token = String(path.dropFirst("/event/".count))
            pendingRoute = .publicEvent(token: token)
        } else if components.host == "boardgametools.vercel.app" {
            if path.hasPrefix("/public/event/") {
                let token = String(path.dropFirst("/public/event/".count))
                pendingRoute = .publicEvent(token: token)
            } else if path.hasPrefix("/dashboard/games/") {
                let id = String(path.dropFirst("/dashboard/games/".count))
                pendingRoute = .game(id: id)
            } else if path.hasPrefix("/dashboard/events/") {
                let id = String(path.dropFirst("/dashboard/events/".count))
                pendingRoute = .event(id: id)
            } else if path.hasPrefix("/dashboard/groups/") {
                let id = String(path.dropFirst("/dashboard/groups/".count))
                pendingRoute = .group(id: id)
            }
        }
    }

    func consume() -> DeepLinkRoute? {
        defer { pendingRoute = nil }
        return pendingRoute
    }
}
```

Create `BoardGameTools/Services/NetworkMonitor.swift`:
```swift
import Foundation
import Network
import Observation

@Observable
@MainActor
final class NetworkMonitor {
    private(set) var isConnected = true
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}
```

Create `BoardGameTools/AppDelegate.swift`:
```swift
import UIKit
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .deviceTokenReceived, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Push registration failed: \(error.localizedDescription)")
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .badge, .sound]
    }
}
```

Create `BoardGameTools/Features/Events/PublicEventView.swift`:
```swift
import SwiftUI

struct PublicEventView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    let token: String
    @State private var event: EventDTO?
    @State private var errorMessage: String?
    @State private var voterName = ""
    @State private var isLoading = false

    var body: some View {
        Form {
            if let event {
                Section("Event") {
                    Text(event.title).font(.headline)
                    Text(event.eventDate, style: .date)
                    if let description = event.description, !description.isEmpty {
                        Text(description)
                    }
                }
                if let proposals = event.proposals, !proposals.isEmpty {
                    Section("Spielvorschläge") {
                        ForEach(proposals, id: \.id) { proposal in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(proposal.bggName ?? proposal.gameId ?? "Vorschlag").font(.subheadline)
                                if let count = proposal.voteCount {
                                    Text("\(count) Stimmen").font(.caption)
                                }
                                Button("Abstimmen") {
                                    Task { await vote(for: proposal.id) }
                                }
                                .disabled(voterName.isEmpty)
                            }
                        }
                    }
                }
                Section("Dein Name") {
                    TextField("Name", text: $voterName)
                }
            } else if isLoading {
                ProgressView()
            } else if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }
        }
        .navigationTitle("Öffentliches Event")
        .task {
            await load()
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            event = try await appModel.remoteDataSource.getPublicEvent(token: token)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func vote(for proposalId: String) async {
        guard !voterName.isEmpty else { return }
        isLoading = true
        do {
            let request = PublicVoteRequest(proposalId: proposalId, voterName: voterName)
            event = try await appModel.remoteDataSource.publicVote(token: token, request)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

Run the `DeepLinkHandlerTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Services/NotificationManager.swift BoardGameTools/Services/DeepLinkHandler.swift BoardGameTools/Services/NetworkMonitor.swift BoardGameTools/AppDelegate.swift BoardGameTools/Features/Events/PublicEventView.swift BoardGameToolsTests/DeepLinkHandlerTests.swift
git commit -m "feat(ios): push, deep links, network monitoring and public event view"
```

### Task 17: AppModel, App Entry Point, RootView and MainTabView

**Files:**
- Create: `BoardGameTools/App/BoardGameToolsApp.swift`
- Create: `BoardGameTools/App/AppModel.swift`
- Create: `BoardGameTools/App/RootView.swift`
- Create: `BoardGameTools/App/MainTabView.swift`
- Test: `BoardGameToolsTests/AppModelTests.swift` (compile/build test)

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/AppModelTests.swift`:
```swift
import Testing
@testable import BoardGameTools

struct AppModelTests {
    @Test @MainActor func appModelInitializesDependencies() {
        let appModel = AppModel()
        #expect(appModel.authManager.isAuthenticated == false)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build -only-testing BoardGameToolsTests/AppModelTests
```
Expected: FAIL with `Cannot find 'AppModel' in scope`.

- [ ] **Step 2: Implement App entry point**

Create `BoardGameTools/App/AppModel.swift`:
```swift
import SwiftUI
import SwiftData
import Observation

@Observable
@MainActor
final class AppModel {
    let modelContainer: ModelContainer
    let apiClient: any APIClientProtocol
    let authManager: AuthManager
    let localDataSource: LocalDataSource
    let remoteDataSource: RemoteDataSource
    let syncEngine: SyncEngine
    let gameRepository: GameRepository
    let sessionRepository: SessionRepository
    let eventRepository: EventRepository
    let groupRepository: GroupRepository
    let notificationManager: NotificationManager
    let deepLinkHandler: DeepLinkHandler
    let networkMonitor: NetworkMonitor

    init() {
        let schema = Schema([
            LocalGame.self,
            LocalTag.self,
            LocalSession.self,
            LocalSessionPlayer.self,
            LocalEvent.self,
            LocalEventProposal.self,
            LocalVote.self,
            LocalDateProposal.self,
            LocalDateVote.self,
            LocalGroup.self,
            LocalGroupMember.self,
            LocalGroupPoll.self,
            LocalGroupPollOption.self,
            LocalGroupPollVote.self,
            LocalGroupComment.self,
            LocalSyncMetadata.self
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        let container = try! ModelContainer(for: schema, configurations: [config])
        self.modelContainer = container

        let api = APIClient(baseURL: URL(string: "https://boardgametools.vercel.app")!)
        self.apiClient = api
        self.authManager = AuthManager(apiClient: api)
        self.remoteDataSource = RemoteDataSource(apiClient: api)
        self.localDataSource = LocalDataSource(modelContainer: container)
        self.syncEngine = SyncEngine(local: self.localDataSource, remote: self.remoteDataSource)
        self.gameRepository = GameRepository(local: self.localDataSource, remote: self.remoteDataSource, syncEngine: self.syncEngine)
        self.sessionRepository = SessionRepository(local: self.localDataSource, remote: self.remoteDataSource, syncEngine: self.syncEngine)
        self.eventRepository = EventRepository(local: self.localDataSource, remote: self.remoteDataSource, syncEngine: self.syncEngine)
        self.groupRepository = GroupRepository(local: self.localDataSource, remote: self.remoteDataSource, syncEngine: self.syncEngine)
        self.notificationManager = NotificationManager(apiClient: api)
        self.deepLinkHandler = DeepLinkHandler()
        self.networkMonitor = NetworkMonitor()

        Task {
            await api.setTokenProvider { [weak self] in
                await self?.authManager.accessToken()
            }
            await authManager.checkInitialAuth()
            _ = try? await notificationManager.requestAuthorization()
            notificationManager.registerForRemoteNotifications()
        }
    }
}
```

Create `BoardGameTools/App/BoardGameToolsApp.swift`:
```swift
import SwiftUI
import SwiftData

@main
struct BoardGameToolsApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appModel = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appModel)
                .modelContainer(appModel.modelContainer)
                .onOpenURL { url in
                    appModel.deepLinkHandler.handle(url: url)
                }
        }
    }
}
```

Create `BoardGameTools/App/RootView.swift`:
```swift
import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var appModel

    var body: some View {
        Group {
            if appModel.authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}
```

Create `BoardGameTools/App/MainTabView.swift`:
```swift
import SwiftUI

struct MainTabView: View {
    @Environment(AppModel.self) private var appModel

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Übersicht", systemImage: "square.grid.2x2") }
            GameListView()
                .tabItem { Label("Spiele", systemImage: "dice") }
            SessionListView()
                .tabItem { Label("Sessions", systemImage: "calendar") }
            EventListView()
                .tabItem { Label("Events", systemImage: "ticket") }
            GroupListView()
                .tabItem { Label("Gruppen", systemImage: "person.3") }
        }
    }
}
```

Run the build/test command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/App/AppModel.swift BoardGameTools/App/BoardGameToolsApp.swift BoardGameTools/App/RootView.swift BoardGameTools/App/MainTabView.swift BoardGameToolsTests/AppModelTests.swift
git commit -m "feat(ios): AppModel, app entry point and root navigation"
```

### Task 18: LoginView and LoginViewModel

**Files:**
- Create: `BoardGameTools/Features/Auth/LoginViewModel.swift`
- Create: `BoardGameTools/Features/Auth/LoginView.swift`
- Test: `BoardGameToolsTests/LoginViewModelTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/LoginViewModelTests.swift`:
```swift
import Testing
import AuthenticationServices
@testable import BoardGameTools

@MainActor
final class MockAuthManager: AuthManaging {
    var loggedIn = false
    var appleSignedIn = false

    var isAuthenticated: Bool { loggedIn }

    func login(email: String, password: String) async throws {
        loggedIn = true
    }

    func signInWithApple(identityToken: String, authorizationCode: String, fullName: String?) async throws {
        appleSignedIn = true
    }

    func logout() async {}
    func accessToken() async -> String? { nil }
    func checkInitialAuth() async {}
}

struct LoginViewModelTests {
    @Test @MainActor func loginCallsAuthManager() async throws {
        let auth = MockAuthManager()
        let vm = LoginViewModel(authManager: auth)
        vm.email = "a@b.de"
        vm.password = "geheim"
        await vm.login()
        #expect(auth.loggedIn)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/LoginViewModelTests
```
Expected: FAIL with `Cannot find 'LoginViewModel' in scope`.

- [ ] **Step 2: Implement LoginView and ViewModel**

Add `AuthManaging` protocol to `BoardGameTools/Managers/AuthManager.swift` and make `AuthManager` conform:

```swift
@MainActor
protocol AuthManaging: Sendable {
    var isAuthenticated: Bool { get }
    func login(email: String, password: String) async throws
    func signInWithApple(identityToken: String, authorizationCode: String, fullName: String?) async throws
    func logout() async
    func accessToken() async -> String?
    func checkInitialAuth() async
}
```

Change the `AuthManager` declaration from `final class AuthManager` to `final class AuthManager: AuthManaging` in the same file. The existing methods already satisfy the protocol, so no further implementation changes are needed.

Create `BoardGameTools/Features/Auth/LoginViewModel.swift`:
```swift
import Foundation
import Observation
import AuthenticationServices

@Observable
@MainActor
final class LoginViewModel {
    var email = ""
    var password = ""
    var isLoading = false
    var errorMessage: String?

    private let authManager: any AuthManaging

    init(authManager: any AuthManaging) {
        self.authManager = authManager
    }

    func login() async {
        isLoading = true
        errorMessage = nil
        do {
            try await authManager.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let identityToken = String(data: tokenData, encoding: .utf8),
                  let authCodeData = credential.authorizationCode,
                  let authorizationCode = String(data: authCodeData, encoding: .utf8) else {
                errorMessage = "Apple-Anmeldung fehlgeschlagen"
                return
            }
            let fullName = credential.fullName?.givenName
            do {
                try await authManager.signInWithApple(identityToken: identityToken, authorizationCode: authorizationCode, fullName: fullName)
            } catch {
                errorMessage = error.localizedDescription
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}
```

Create `BoardGameTools/Features/Auth/LoginView.swift`:
```swift
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @State var viewModel: LoginViewModel

    var body: some View {
        VStack(spacing: 20) {
            Text("BoardGameTools").font(.largeTitle)
            TextField("E-Mail", text: $viewModel.email)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .textFieldStyle(.roundedBorder)
            SecureField("Passwort", text: $viewModel.password)
                .textFieldStyle(.roundedBorder)
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Button("Anmelden") {
                Task { await viewModel.login() }
            }
            .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)
            SignInWithAppleButton { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                Task { await viewModel.handleAppleSignIn(result) }
            }
            .frame(height: 44)
        }
        .padding()
    }
}
```

Update `RootView.swift` to inject `LoginViewModel`:
```swift
if appModel.authManager.isAuthenticated {
    MainTabView()
} else {
    LoginView(viewModel: LoginViewModel(authManager: appModel.authManager))
}
```

Run the `LoginViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Auth BoardGameTools/Managers/AuthManager.swift BoardGameTools/App/RootView.swift BoardGameToolsTests/LoginViewModelTests.swift
git commit -m "feat(ios): LoginView and LoginViewModel with Sign in with Apple"
```

### Task 19: DashboardView

**Files:**
- Create: `BoardGameTools/Features/Dashboard/DashboardViewModel.swift`
- Create: `BoardGameTools/Features/Dashboard/DashboardView.swift`
- Test: `BoardGameToolsTests/DashboardViewModelTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/DashboardViewModelTests.swift`:
```swift
import Testing
@testable import BoardGameTools

final class MockAPIClientForDashboard: APIClientProtocol {
    var dashboardResponse: DashboardDTO?

    func request<T: Decodable & Sendable>(_ endpoint: Endpoint, body: (any Encodable & Sendable)? = nil) async throws -> T {
        if case .dashboard = endpoint, let response = dashboardResponse as? T { return response }
        throw APIError.invalidResponse
    }

    func request(_ endpoint: Endpoint, body: (any Encodable & Sendable)? = nil) async throws -> Data { Data() }
    func setTokenProvider(_ provider: @escaping @Sendable () async -> String?) {}
}

struct DashboardViewModelTests {
    @Test @MainActor func loadDashboardFillsStats() async throws {
        let api = MockAPIClientForDashboard()
        api.dashboardResponse = DashboardDTO(totalGames: 5, totalSessions: 3, upcomingEvents: 1, groupsCount: 1)
        let vm = DashboardViewModel(apiClient: api)
        await vm.load()
        #expect(vm.dashboard?.totalGames == 5)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/DashboardViewModelTests
```
Expected: FAIL with `Cannot find 'DashboardViewModel' in scope`.

- [ ] **Step 2: Implement Dashboard**

Create `BoardGameTools/Features/Dashboard/DashboardViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class DashboardViewModel {
    private let apiClient: any APIClientProtocol
    var dashboard: DashboardDTO?
    var isLoading = false
    var errorMessage: String?

    init(apiClient: any APIClientProtocol) {
        self.apiClient = apiClient
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            dashboard = try await apiClient.request(.dashboard)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

Create `BoardGameTools/Features/Dashboard/DashboardView.swift`:
```swift
import SwiftUI

struct DashboardView: View {
    @Environment(AppModel.self) private var appModel
    @State private var viewModel: DashboardViewModel?

    var body: some View {
        ScrollView {
            if let vm = viewModel {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    DashboardTile(title: "Spiele", value: vm.dashboard?.totalGames ?? 0, icon: "dice")
                    DashboardTile(title: "Sessions", value: vm.dashboard?.totalSessions ?? 0, icon: "calendar")
                    DashboardTile(title: "Events", value: vm.dashboard?.upcomingEvents ?? 0, icon: "ticket")
                    DashboardTile(title: "Gruppen", value: vm.dashboard?.groupsCount ?? 0, icon: "person.3")
                }
                .padding()
            }
        }
        .navigationTitle("Übersicht")
        .task {
            viewModel = DashboardViewModel(apiClient: appModel.apiClient)
            await viewModel?.load()
        }
    }
}

struct DashboardTile: View {
    let title: String
    let value: Int
    let icon: String

    var body: some View {
        VStack {
            Image(systemName: icon).font(.largeTitle)
            Text(title).font(.headline)
            Text("\(value)").font(.title)
        }
        .frame(maxWidth: .infinity, minHeight: 100)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}
```

Run the `DashboardViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Dashboard BoardGameToolsTests/DashboardViewModelTests.swift
git commit -m "feat(ios): DashboardView with stats"
```

### Task 20: GameList, GameDetail, GameEdit and BGGSearch

**Files:**
- Create: `BoardGameTools/Features/Games/GameListViewModel.swift`
- Create: `BoardGameTools/Features/Games/GameListView.swift`
- Create: `BoardGameTools/Features/Games/GameDetailView.swift`
- Create: `BoardGameTools/Features/Games/GameEditViewModel.swift`
- Create: `BoardGameTools/Features/Games/GameEditView.swift`
- Create: `BoardGameTools/Features/Games/BGGSearchViewModel.swift`
- Create: `BoardGameTools/Features/Games/BGGSearchView.swift`
- Test: `BoardGameToolsTests/GameListViewModelTests.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/GameListViewModelTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct GameListViewModelTests {
    @Test @MainActor func loadFetchesGames() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let sync = SyncEngine(local: local, remote: remote)
        let repo = GameRepository(local: local, remote: remote, syncEngine: sync)
        _ = try await repo.create(name: "Azul")
        let vm = GameListViewModel(gameRepository: repo)
        await vm.load()
        #expect(vm.games.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/GameListViewModelTests
```
Expected: FAIL with `Cannot find 'GameListViewModel' in scope`.

- [ ] **Step 2: Implement GameList, Detail, Edit and BGGSearch**

Create `BoardGameTools/Features/Games/GameListViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class GameListViewModel {
    private let gameRepository: any GameRepositoryProtocol
    var games: [LocalGame] = []
    var searchText = ""
    var isLoading = false
    var errorMessage: String?

    init(gameRepository: any GameRepositoryProtocol) {
        self.gameRepository = gameRepository
    }

    func load() async {
        isLoading = true
        do {
            games = try await gameRepository.list()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func delete(game: LocalGame) async {
        do { try await gameRepository.delete(id: game.id) } catch { print(error) }
        await load()
    }

    var filteredGames: [LocalGame] {
        if searchText.isEmpty { return games }
        return games.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
}
```

Create `BoardGameTools/Features/Games/GameListView.swift`:
```swift
import SwiftUI

struct GameListView: View {
    @Environment(AppModel.self) private var appModel
    @State private var viewModel: GameListViewModel?

    var body: some View {
        NavigationStack {
            List(viewModel?.filteredGames ?? [], id: \.id) { game in
                NavigationLink(destination: GameDetailView(game: game)) {
                    GameRow(game: game)
                }
            }
            .searchable(text: Binding(get: { viewModel?.searchText ?? "" }, set: { viewModel?.searchText = $0 }), prompt: "Spiel suchen")
            .navigationTitle("Spiele")
            .toolbar {
                NavigationLink(destination: GameEditView()) {
                    Image(systemName: "plus")
                }
            }
            .task {
                viewModel = GameListViewModel(gameRepository: appModel.gameRepository)
                await viewModel?.load()
            }
        }
    }
}

struct GameRow: View {
    let game: LocalGame
    var body: some View {
        HStack {
            AsyncImage(url: game.imageUrl.flatMap(URL.init)) { image in
                image.resizable().aspectRatio(contentMode: .fill)
            } placeholder: {
                Color.gray
            }
            .frame(width: 50, height: 50)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading) {
                Text(game.name).font(.headline)
                Text("\(game.minPlayers) - \(game.maxPlayers) Spieler").font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}
```

Create `BoardGameTools/Features/Games/GameDetailView.swift`:
```swift
import SwiftUI

struct GameDetailView: View {
    let game: LocalGame

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if let imageUrl = game.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().aspectRatio(contentMode: .fit)
                    } placeholder: { Color.gray }
                    .frame(maxHeight: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                Text(game.name).font(.title)
                if let description = game.gameDescription, !description.isEmpty {
                    Text(description).font(.body)
                }
                Text("Spieler: \(game.minPlayers) - \(game.maxPlayers)").font(.subheadline)
                if let time = game.playTimeMinutes {
                    Text("Spielzeit: \(time) Minuten").font(.subheadline)
                }
                if let tags = game.tagNames, !tags.isEmpty {
                    Text("Tags: " + tags.joined(separator: ", ")).font(.caption)
                }
                Spacer()
            }
            .padding()
        }
        .navigationTitle(game.name)
        .toolbar {
            NavigationLink(destination: GameEditView(game: game)) {
                Text("Bearbeiten")
            }
        }
    }
}
```

Create `BoardGameTools/Features/Games/GameEditViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class GameEditViewModel {
    private let gameRepository: any GameRepositoryProtocol
    var game: LocalGame?

    var name = ""
    var gameDescription = ""
    var minPlayers = ""
    var maxPlayers = ""
    var playTimeMinutes = ""
    var complexity = ""
    var bggId: String?
    var imageUrl = ""
    var tagNames = ""
    var isSaving = false
    var errorMessage: String?

    init(gameRepository: any GameRepositoryProtocol, game: LocalGame? = nil) {
        self.gameRepository = gameRepository
        self.game = game
        if let game {
            name = game.name
            gameDescription = game.gameDescription ?? ""
            minPlayers = String(game.minPlayers)
            maxPlayers = String(game.maxPlayers)
            playTimeMinutes = game.playTimeMinutes.map(String.init) ?? ""
            complexity = game.complexity.map(String.init) ?? ""
            bggId = game.bggId
            imageUrl = game.imageUrl ?? ""
            tagNames = game.tagNames?.joined(separator: ", ") ?? ""
        }
    }

    func save() async -> Bool {
        isSaving = true
        errorMessage = nil
        let tags = tagNames.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        do {
            if let existing = game {
                _ = try await gameRepository.update(
                    id: existing.id,
                    name: name,
                    description: gameDescription.isEmpty ? nil : gameDescription,
                    minPlayers: Int(minPlayers),
                    maxPlayers: Int(maxPlayers),
                    playTimeMinutes: Int(playTimeMinutes),
                    complexity: Int(complexity),
                    bggId: bggId,
                    ean: nil,
                    imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                    tagNames: tags.isEmpty ? nil : tags
                )
            } else {
                _ = try await gameRepository.create(
                    name: name,
                    description: gameDescription.isEmpty ? nil : gameDescription,
                    minPlayers: Int(minPlayers),
                    maxPlayers: Int(maxPlayers),
                    playTimeMinutes: Int(playTimeMinutes),
                    complexity: Int(complexity),
                    bggId: bggId,
                    ean: nil,
                    imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                    tagNames: tags.isEmpty ? nil : tags
                )
            }
            isSaving = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return false
        }
    }
}
```

Create `BoardGameTools/Features/Games/GameEditView.swift`:
```swift
import SwiftUI

struct GameEditView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    var game: LocalGame? = nil
    @State private var viewModel: GameEditViewModel?
    @State private var showBGGSearch = false
    @State private var showBarcode = false
    @State private var showCoverOCR = false

    var body: some View {
        Form {
            if let vm = viewModel {
                Section("Allgemein") {
                    TextField("Name", text: Binding(get: { vm.name }, set: { vm.name = $0 }))
                    TextField("Beschreibung", text: Binding(get: { vm.gameDescription }, set: { vm.gameDescription = $0 }))
                }
                Section("Details") {
                    TextField("Min. Spieler", text: Binding(get: { vm.minPlayers }, set: { vm.minPlayers = $0 }))
                        .keyboardType(.numberPad)
                    TextField("Max. Spieler", text: Binding(get: { vm.maxPlayers }, set: { vm.maxPlayers = $0 }))
                        .keyboardType(.numberPad)
                    TextField("Spielzeit (Min)", text: Binding(get: { vm.playTimeMinutes }, set: { vm.playTimeMinutes = $0 }))
                        .keyboardType(.numberPad)
                    TextField("Komplexität (1-5)", text: Binding(get: { vm.complexity }, set: { vm.complexity = $0 }))
                        .keyboardType(.numberPad)
                    TextField("Bild-URL", text: Binding(get: { vm.imageUrl }, set: { vm.imageUrl = $0 }))
                        .textInputAutocapitalization(.never)
                    TextField("Tags (kommasepariert)", text: Binding(get: { vm.tagNames }, set: { vm.tagNames = $0 }))
                }
                if let error = vm.errorMessage {
                    Text(error).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(game == nil ? "Neues Spiel" : "Spiel bearbeiten")
        .toolbar {
            Button("Speichern") {
                Task {
                    if await viewModel?.save() == true { dismiss() }
                }
            }
            .disabled(viewModel?.isSaving ?? true)
            Menu("Importieren") {
                Button("BGG Suche") { showBGGSearch = true }
                Button("Barcode scannen") { showBarcode = true }
                Button("Cover fotografieren") { showCoverOCR = true }
            }
        }
        .task {
            viewModel = GameEditViewModel(gameRepository: appModel.gameRepository, game: game)
        }
        .sheet(isPresented: $showBGGSearch) { BGGSearchView() }
        .sheet(isPresented: $showBarcode) { BarcodeScannerView() }
        .sheet(isPresented: $showCoverOCR) { CoverOCRView() }
    }
}
```

Create `BoardGameTools/Features/Games/BGGSearchViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class BGGSearchViewModel {
    private let remote: any RemoteDataSourceProtocol
    private let gameRepository: any GameRepositoryProtocol
    var query = ""
    var results: [BGGSearchResultDTO] = []
    var isSearching = false
    var errorMessage: String?

    init(remote: any RemoteDataSourceProtocol, gameRepository: any GameRepositoryProtocol) {
        self.remote = remote
        self.gameRepository = gameRepository
    }

    func search() async {
        isSearching = true
        errorMessage = nil
        do {
            results = try await remote.searchBGG(query: query)
        } catch {
            errorMessage = error.localizedDescription
        }
        isSearching = false
    }

    func importResult(_ result: BGGSearchResultDTO) async throws -> LocalGame {
        try await gameRepository.importFromBGG(bggId: result.bggId)
    }
}
```

Create `BoardGameTools/Features/Games/BGGSearchView.swift`:
```swift
import SwiftUI

struct BGGSearchView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: BGGSearchViewModel?

    var body: some View {
        NavigationStack {
            VStack {
                if let vm = viewModel {
                    HStack {
                        TextField("Suchen", text: Binding(get: { vm.query }, set: { vm.query = $0 }))
                            .textFieldStyle(.roundedBorder)
                        Button("Suchen") { Task { await vm.search() } }
                            .disabled(vm.query.isEmpty || vm.isSearching)
                    }
                    .padding()
                    List(vm.results, id: \.bggId) { result in
                        Button {
                            Task {
                                _ = try? await vm.importResult(result)
                                dismiss()
                            }
                        } label: {
                            VStack(alignment: .leading) {
                                Text(result.name).font(.headline)
                                Text("BGG-ID: \(result.bggId)").font(.caption)
                            }
                        }
                    }
                }
            }
            .navigationTitle("BGG Import")
            .task {
                viewModel = BGGSearchViewModel(remote: appModel.remoteDataSource, gameRepository: appModel.gameRepository)
            }
        }
    }
}
```

Run the `GameListViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Games BoardGameToolsTests/GameListViewModelTests.swift
git commit -m "feat(ios): Game list, detail, edit and BGG import views"
```

### Task 21: BarcodeScanner

**Files:**
- Create: `BoardGameTools/Features/Games/BarcodeScannerViewModel.swift`
- Create: `BoardGameTools/Features/Games/BarcodeScannerView.swift`

- [ ] **Step 1: Write the failing build test**

There is no isolated unit test for the camera UI. Instead run the build command and expect a compilation error until the files exist:

```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Expected: FAIL with `Cannot find 'BarcodeScannerView' in scope`.

- [ ] **Step 2: Implement BarcodeScanner**

Create `BoardGameTools/Features/Games/BarcodeScannerViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class BarcodeScannerViewModel {
    private let remote: any RemoteDataSourceProtocol
    private let gameRepository: any GameRepositoryProtocol
    var foundGame: LocalGame?
    var isSearching = false
    var errorMessage: String?
    var scannedCode: String?

    init(remote: any RemoteDataSourceProtocol, gameRepository: any GameRepositoryProtocol) {
        self.remote = remote
        self.gameRepository = gameRepository
    }

    func handleScannedCode(_ code: String) async {
        guard scannedCode != code else { return }
        scannedCode = code
        isSearching = true
        do {
            let results = try await remote.lookupBGG(ean: code)
            if let first = results.first {
                foundGame = try await gameRepository.importFromBGG(bggId: first.bggId)
            } else {
                errorMessage = "Kein Spiel mit diesem Barcode gefunden"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isSearching = false
    }
}
```

Create `BoardGameTools/Features/Games/BarcodeScannerView.swift`:
```swift
import SwiftUI
import AVFoundation

struct BarcodeScannerView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: BarcodeScannerViewModel?

    var body: some View {
        ZStack {
            if let vm = viewModel {
                BarcodeScannerPreview { code in
                    Task { await vm.handleScannedCode(code) }
                }
                .overlay(alignment: .top) {
                    if vm.isSearching {
                        ProgressView("Suche…")
                            .padding()
                            .background(.regularMaterial)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .task {
            viewModel = BarcodeScannerViewModel(remote: appModel.remoteDataSource, gameRepository: appModel.gameRepository)
        }
        .onChange(of: viewModel?.foundGame != nil) { _, hasGame in
            if hasGame { dismiss() }
        }
    }
}

struct BarcodeScannerPreview: UIViewControllerRepresentable {
    let onCode: (String) -> Void

    func makeUIViewController(context: Context) -> BarcodeScannerViewController {
        let controller = BarcodeScannerViewController()
        controller.onCode = onCode
        return controller
    }

    func updateUIViewController(_ uiViewController: BarcodeScannerViewController, context: Context) {}
}

final class BarcodeScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    private var captureSession: AVCaptureSession?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else { return }
        let session = AVCaptureSession()
        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue(label: "BarcodeScanner"))
        output.metadataObjectTypes = [.ean8, .ean13]
        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.layer.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        captureSession = session
        Task { session.startRunning() }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           let code = object.stringValue {
            DispatchQueue.main.async { self.onCode?(code) }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }
}
```

Run the build command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Games/BarcodeScannerViewModel.swift BoardGameTools/Features/Games/BarcodeScannerView.swift
git commit -m "feat(ios): EAN barcode scanner with BGG lookup"
```

### Task 22: CoverOCR

**Files:**
- Create: `BoardGameTools/Features/Games/CoverOCRViewModel.swift`
- Create: `BoardGameTools/Features/Games/CoverOCRView.swift`

- [ ] **Step 1: Write the failing build test**

```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Expected: FAIL with `Cannot find 'CoverOCRView' in scope`.

- [ ] **Step 2: Implement CoverOCR**

Create `BoardGameTools/Features/Games/CoverOCRViewModel.swift`:
```swift
import Foundation
import Observation
import Vision
import UIKit

@Observable
@MainActor
final class CoverOCRViewModel {
    private let remote: any RemoteDataSourceProtocol
    private let gameRepository: any GameRepositoryProtocol
    var recognizedTitle: String?
    var foundGame: LocalGame?
    var isSearching = false
    var errorMessage: String?

    init(remote: any RemoteDataSourceProtocol, gameRepository: any GameRepositoryProtocol) {
        self.remote = remote
        self.gameRepository = gameRepository
    }

    func analyze(_ image: UIImage) async {
        guard let cgImage = image.cgImage else { return }
        let request = VNRecognizeTextRequest { [weak self] request, _ in
            guard let results = request.results as? [VNRecognizedTextObservation] else { return }
            let candidates = results.compactMap { $0.topCandidates(1).first?.string }
            if let longest = candidates.max(by: { $0.count < $1.count }), !longest.isEmpty {
                Task { @MainActor in
                    self?.recognizedTitle = longest
                    await self?.search(title: longest)
                }
            }
        }
        request.recognitionLevel = .accurate
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try? handler.perform([request])
    }

    private func search(title: String) async {
        isSearching = true
        do {
            let results = try await remote.searchBGG(query: title)
            if let first = results.first {
                foundGame = try await gameRepository.importFromBGG(bggId: first.bggId)
            } else {
                errorMessage = "Kein Spiel mit diesem Titel gefunden"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isSearching = false
    }
}
```

Create `BoardGameTools/Features/Games/CoverOCRView.swift`:
```swift
import SwiftUI
import AVFoundation

struct CoverOCRView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: CoverOCRViewModel?
    @State private var capturedImage: UIImage?

    var body: some View {
        ZStack {
            if let vm = viewModel {
                CameraPreview { image in
                    capturedImage = image
                    Task { await vm.analyze(image) }
                }
                .overlay(alignment: .top) {
                    if vm.isSearching {
                        ProgressView("Suche…")
                            .padding()
                            .background(.regularMaterial)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .task {
            viewModel = CoverOCRViewModel(remote: appModel.remoteDataSource, gameRepository: appModel.gameRepository)
        }
        .onChange(of: viewModel?.foundGame != nil) { _, hasGame in
            if hasGame { dismiss() }
        }
    }
}

struct CameraPreview: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> CameraPreviewViewController {
        let vc = CameraPreviewViewController()
        vc.onCapture = onCapture
        return vc
    }

    func updateUIViewController(_ uiViewController: CameraPreviewViewController, context: Context) {}
}

final class CameraPreviewViewController: UIViewController {
    var onCapture: ((UIImage) -> Void)?
    private var captureSession: AVCaptureSession?
    private var photoOutput: AVCapturePhotoOutput?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
        let tap = UITapGestureRecognizer(target: self, action: #selector(capture))
        view.addGestureRecognizer(tap)
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else { return }
        let session = AVCaptureSession()
        session.addInput(input)
        let output = AVCapturePhotoOutput()
        session.addOutput(output)
        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.layer.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        captureSession = session
        photoOutput = output
        Task { session.startRunning() }
    }

    @objc private func capture() {
        let settings = AVCapturePhotoSettings()
        photoOutput?.capturePhoto(with: settings, delegate: self)
    }
}

extension CameraPreviewViewController: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation(), let image = UIImage(data: data) else { return }
        DispatchQueue.main.async { self.onCapture?(image) }
    }
}
```

Run the build command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Games/CoverOCRViewModel.swift BoardGameTools/Features/Games/CoverOCRView.swift
git commit -m "feat(ios): cover OCR via Vision and BGG search"
```

### Task 23: SessionList and SessionEdit

**Files:**
- Create: `BoardGameTools/Features/Sessions/SessionListViewModel.swift`
- Create: `BoardGameTools/Features/Sessions/SessionListView.swift`
- Create: `BoardGameTools/Features/Sessions/SessionEditViewModel.swift`
- Create: `BoardGameTools/Features/Sessions/SessionEditView.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/SessionListViewModelTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct SessionListViewModelTests {
    @Test @MainActor func loadFetchesSessions() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let sync = SyncEngine(local: local, remote: remote)
        let repo = SessionRepository(local: local, remote: remote, syncEngine: sync)
        let player = SessionPlayerInput(userId: "u1", score: 10, isWinner: true, placement: 1)
        _ = try await repo.create(gameId: "g1", playedAt: Date(), durationMinutes: 60, notes: nil, players: [player])
        let vm = SessionListViewModel(sessionRepository: repo)
        await vm.load()
        #expect(vm.sessions.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/SessionListViewModelTests
```
Expected: FAIL with `Cannot find 'SessionListViewModel' in scope`.

- [ ] **Step 2: Implement SessionList and SessionEdit**

Create `BoardGameTools/Features/Sessions/SessionListViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class SessionListViewModel {
    private let sessionRepository: any SessionRepositoryProtocol
    var sessions: [LocalSession] = []
    var isLoading = false
    var errorMessage: String?

    init(sessionRepository: any SessionRepositoryProtocol) {
        self.sessionRepository = sessionRepository
    }

    func load() async {
        isLoading = true
        do {
            sessions = try await sessionRepository.list()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func delete(session: LocalSession) async {
        do { try await sessionRepository.delete(id: session.id) } catch { print(error) }
        await load()
    }
}
```

Create `BoardGameTools/Features/Sessions/SessionListView.swift`:
```swift
import SwiftUI

struct SessionListView: View {
    @Environment(AppModel.self) private var appModel
    @State private var viewModel: SessionListViewModel?

    var body: some View {
        NavigationStack {
            List(viewModel?.sessions ?? [], id: \.id) { session in
                VStack(alignment: .leading) {
                    Text(session.playedAt, style: .date).font(.headline)
                    if let game = session.game { Text(game.name).font(.subheadline) }
                    if let duration = session.durationMinutes {
                        Text("\(duration) Minuten").font(.caption)
                    }
                }
            }
            .navigationTitle("Sessions")
            .toolbar {
                NavigationLink(destination: SessionEditView()) { Image(systemName: "plus") }
            }
            .task {
                viewModel = SessionListViewModel(sessionRepository: appModel.sessionRepository)
                await viewModel?.load()
            }
        }
    }
}
```

Create `BoardGameTools/Features/Sessions/SessionEditViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class SessionEditViewModel {
    private let sessionRepository: any SessionRepositoryProtocol
    private let gameRepository: any GameRepositoryProtocol
    var game: LocalGame?
    var playedAt = Date()
    var durationMinutes = ""
    var notes = ""
    var players: [PlayerInput] = [PlayerInput()]
    var isSaving = false
    var errorMessage: String?

    struct PlayerInput: Identifiable, Hashable {
        let id = UUID()
        var userId = ""
        var score = ""
        var isWinner = false
        var placement = ""
    }

    init(sessionRepository: any SessionRepositoryProtocol, gameRepository: any GameRepositoryProtocol, game: LocalGame? = nil) {
        self.sessionRepository = sessionRepository
        self.gameRepository = gameRepository
        self.game = game
    }

    func save() async -> Bool {
        guard let game else {
            errorMessage = "Kein Spiel ausgewählt"
            return false
        }
        isSaving = true
        let inputs = players.map {
            SessionPlayerInput(
                userId: $0.userId.isEmpty ? "local-user" : $0.userId,
                score: Int($0.score),
                isWinner: $0.isWinner,
                placement: Int($0.placement)
            )
        }
        do {
            _ = try await sessionRepository.create(
                gameId: game.id,
                playedAt: playedAt,
                durationMinutes: Int(durationMinutes),
                notes: notes.isEmpty ? nil : notes,
                players: inputs
            )
            isSaving = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return false
        }
    }

    func loadGames() async -> [LocalGame] {
        do { return try await gameRepository.list() } catch { return [] }
    }
}
```

Create `BoardGameTools/Features/Sessions/SessionEditView.swift`:
```swift
import SwiftUI

struct SessionEditView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: SessionEditViewModel?
    @State private var games: [LocalGame] = []

    var body: some View {
        Form {
            if let vm = viewModel {
                Picker("Spiel", selection: Binding(get: { vm.game?.id }, set: { id in vm.game = games.first(where: { $0.id == id }) })) {
                    ForEach(games, id: \.id) { game in
                        Text(game.name).tag(game.id)
                    }
                }
                DatePicker("Gespielt am", selection: Binding(get: { vm.playedAt }, set: { vm.playedAt = $0 }))
                TextField("Dauer (Min)", text: Binding(get: { vm.durationMinutes }, set: { vm.durationMinutes = $0 }))
                    .keyboardType(.numberPad)
                TextField("Notizen", text: Binding(get: { vm.notes }, set: { vm.notes = $0 }))

                Section("Spieler") {
                    ForEach($vm.players) { $player in
                        HStack {
                            TextField("Name", text: $player.userId)
                            TextField("Punkte", text: $player.score)
                                .keyboardType(.numberPad)
                            Toggle("Gewinner", isOn: $player.isWinner)
                        }
                    }
                    Button("Spieler hinzufügen") {
                        vm.players.append(SessionEditViewModel.PlayerInput())
                    }
                }

                if let error = vm.errorMessage {
                    Text(error).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Neue Session")
        .toolbar {
            Button("Speichern") {
                Task { if await viewModel?.save() == true { dismiss() } }
            }
            .disabled(viewModel?.isSaving ?? true)
        }
        .task {
            viewModel = SessionEditViewModel(sessionRepository: appModel.sessionRepository, gameRepository: appModel.gameRepository)
            games = await viewModel?.loadGames() ?? []
            viewModel?.game = games.first
        }
    }
}
```

Run the `SessionListViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Sessions BoardGameToolsTests/SessionListViewModelTests.swift
git commit -m "feat(ios): Session list and edit views"
```

### Task 24: EventList, EventDetail and Voting

**Files:**
- Create: `BoardGameTools/Features/Events/EventListViewModel.swift`
- Create: `BoardGameTools/Features/Events/EventListView.swift`
- Create: `BoardGameTools/Features/Events/EventDetailView.swift`
- Create: `BoardGameTools/Features/Events/EventEditView.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/EventListViewModelTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct EventListViewModelTests {
    @Test @MainActor func loadFetchesEvents() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let sync = SyncEngine(local: local, remote: remote)
        let repo = EventRepository(local: local, remote: remote, syncEngine: sync)
        _ = try await repo.create(title: "Spieleabend", eventDate: Date())
        let vm = EventListViewModel(eventRepository: repo)
        await vm.load()
        #expect(vm.events.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/EventListViewModelTests
```
Expected: FAIL with `Cannot find 'EventListViewModel' in scope`.

- [ ] **Step 2: Implement EventList, Detail and Voting**

Create `BoardGameTools/Features/Events/EventListViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class EventListViewModel {
    private let eventRepository: any EventRepositoryProtocol
    var events: [LocalEvent] = []
    var isLoading = false
    var errorMessage: String?

    init(eventRepository: any EventRepositoryProtocol) {
        self.eventRepository = eventRepository
    }

    func load() async {
        isLoading = true
        do {
            events = try await eventRepository.list()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

Create `BoardGameTools/Features/Events/EventListView.swift`:
```swift
import SwiftUI

struct EventListView: View {
    @Environment(AppModel.self) private var appModel
    @State private var viewModel: EventListViewModel?

    var body: some View {
        NavigationStack {
            List(viewModel?.events ?? [], id: \.id) { event in
                NavigationLink(destination: EventDetailView(event: event)) {
                    VStack(alignment: .leading) {
                        Text(event.title).font(.headline)
                        Text(event.eventDate, style: .date).font(.subheadline)
                    }
                }
            }
            .navigationTitle("Events")
            .toolbar {
                NavigationLink(destination: EventEditView()) { Image(systemName: "plus") }
            }
            .task {
                viewModel = EventListViewModel(eventRepository: appModel.eventRepository)
                await viewModel?.load()
            }
        }
    }
}
```

Create `BoardGameTools/Features/Events/EventDetailView.swift`:
```swift
import SwiftUI

struct EventDetailView: View {
    @Environment(AppModel.self) private var appModel
    let event: LocalEvent
    @State private var selectedProposal: LocalEventProposal?
    @State private var selectedDateProposal: LocalDateProposal?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(event.title).font(.title)
                if let description = event.eventDescription, !description.isEmpty { Text(description) }
                Text(event.eventDate, style: .date).font(.headline)
                if let location = event.location { Text("Ort: \(location)") }

                Text("Spielvorschläge").font(.headline)
                ForEach(event.proposals ?? [], id: \.id) { proposal in
                    Button {
                        Task { try? await appModel.eventRepository.vote(eventId: event.id, proposalId: proposal.id) }
                    } label: {
                        HStack {
                            Text(proposal.bggName ?? proposal.game?.name ?? "Vorschlag")
                            Spacer()
                            if proposal.id == event.winningProposalId { Image(systemName: "checkmark") }
                        }
                    }
                }

                Text("Terminvorschläge").font(.headline)
                ForEach(event.dateProposals ?? [], id: \.id) { proposal in
                    Button {
                        Task { try? await appModel.eventRepository.dateVote(eventId: event.id, dateProposalId: proposal.id, availability: "available") }
                    } label: {
                        Text(proposal.proposedDate, style: .date)
                    }
                }
            }
            .padding()
        }
        .navigationTitle(event.title)
    }
}
```

Create `BoardGameTools/Features/Events/EventEditView.swift`:
```swift
import SwiftUI

struct EventEditView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var eventDescription = ""
    @State private var eventDate = Date()
    @State private var location = ""
    @State private var isSaving = false

    var body: some View {
        Form {
            TextField("Titel", text: $title)
            TextField("Beschreibung", text: $eventDescription)
            DatePicker("Datum", selection: $eventDate)
            TextField("Ort", text: $location)
        }
        .navigationTitle("Neues Event")
        .toolbar {
            Button("Speichern") {
                Task {
                    isSaving = true
                    _ = try? await appModel.eventRepository.create(title: title, description: eventDescription.isEmpty ? nil : eventDescription, eventDate: eventDate, location: location.isEmpty ? nil : location, groupId: nil)
                    isSaving = false
                    dismiss()
                }
            }
            .disabled(title.isEmpty || isSaving)
        }
    }
}
```

Run the `EventListViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Events BoardGameToolsTests/EventListViewModelTests.swift
git commit -m "feat(ios): Event list, detail, create and voting views"
```

### Task 25: GroupList and GroupDetail

**Files:**
- Create: `BoardGameTools/Features/Groups/GroupListViewModel.swift`
- Create: `BoardGameTools/Features/Groups/GroupListView.swift`
- Create: `BoardGameTools/Features/Groups/GroupDetailView.swift`
- Create: `BoardGameTools/Features/Groups/GroupEditView.swift`

- [ ] **Step 1: Write the failing test**

Create `BoardGameToolsTests/GroupListViewModelTests.swift`:
```swift
import Testing
import SwiftData
@testable import BoardGameTools

struct GroupListViewModelTests {
    @Test @MainActor func loadFetchesGroups() async throws {
        let container = try ModelContainer.inMemory()
        let local = LocalDataSource(modelContainer: container)
        let remote = MockRemoteDataSource()
        let sync = SyncEngine(local: local, remote: remote)
        let repo = GroupRepository(local: local, remote: remote, syncEngine: sync)
        _ = try await repo.create(name: "Freitagsrunde")
        let vm = GroupListViewModel(groupRepository: repo)
        await vm.load()
        #expect(vm.groups.count == 1)
    }
}
```

Run:
```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing BoardGameToolsTests/GroupListViewModelTests
```
Expected: FAIL with `Cannot find 'GroupListViewModel' in scope`.

- [ ] **Step 2: Implement GroupList and GroupDetail**

Create `BoardGameTools/Features/Groups/GroupListViewModel.swift`:
```swift
import Foundation
import Observation

@Observable
@MainActor
final class GroupListViewModel {
    private let groupRepository: any GroupRepositoryProtocol
    var groups: [LocalGroup] = []
    var isLoading = false
    var errorMessage: String?

    init(groupRepository: any GroupRepositoryProtocol) {
        self.groupRepository = groupRepository
    }

    func load() async {
        isLoading = true
        do {
            groups = try await groupRepository.list()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

Create `BoardGameTools/Features/Groups/GroupListView.swift`:
```swift
import SwiftUI

struct GroupListView: View {
    @Environment(AppModel.self) private var appModel
    @State private var viewModel: GroupListViewModel?

    var body: some View {
        NavigationStack {
            List(viewModel?.groups ?? [], id: \.id) { group in
                NavigationLink(destination: GroupDetailView(group: group)) {
                    VStack(alignment: .leading) {
                        Text(group.name).font(.headline)
                        if let description = group.groupDescription, !description.isEmpty { Text(description).font(.subheadline) }
                    }
                }
            }
            .navigationTitle("Gruppen")
            .toolbar {
                NavigationLink(destination: GroupEditView()) { Image(systemName: "plus") }
            }
            .task {
                viewModel = GroupListViewModel(groupRepository: appModel.groupRepository)
                await viewModel?.load()
            }
        }
    }
}
```

Create `BoardGameTools/Features/Groups/GroupDetailView.swift`:
```swift
import SwiftUI

struct GroupDetailView: View {
    @Environment(AppModel.self) private var appModel
    let group: LocalGroup
    @State private var newComment = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(group.name).font(.title)
                if let description = group.groupDescription, !description.isEmpty { Text(description) }

                Text("Mitglieder").font(.headline)
                ForEach(group.members ?? [], id: \.id) { member in
                    Text(member.userId)
                }

                Text("Events").font(.headline)
                ForEach(group.events ?? [], id: \.id) { event in
                    Text(event.title)
                }

                Text("Umfragen").font(.headline)
                ForEach(group.polls ?? [], id: \.id) { poll in
                    Text(poll.title)
                }

                Text("Kommentare").font(.headline)
                ForEach(group.comments ?? [], id: \.id) { comment in
                    Text(comment.content)
                }

                TextField("Kommentar schreiben", text: $newComment)
                Button("Senden") {
                    Task {
                        try? await appModel.groupRepository.addComment(groupId: group.id, pollId: nil, content: newComment)
                        newComment = ""
                    }
                }
                .disabled(newComment.isEmpty)
            }
            .padding()
        }
        .navigationTitle(group.name)
    }
}
```

Create `BoardGameTools/Features/Groups/GroupEditView.swift`:
```swift
import SwiftUI

struct GroupEditView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var groupDescription = ""
    @State private var isSaving = false

    var body: some View {
        Form {
            TextField("Name", text: $name)
            TextField("Beschreibung", text: $groupDescription)
        }
        .navigationTitle("Neue Gruppe")
        .toolbar {
            Button("Speichern") {
                Task {
                    isSaving = true
                    _ = try? await appModel.groupRepository.create(name: name, description: groupDescription.isEmpty ? nil : groupDescription)
                    isSaving = false
                    dismiss()
                }
            }
            .disabled(name.isEmpty || isSaving)
        }
    }
}
```

Run the `GroupListViewModelTests` command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Groups BoardGameToolsTests/GroupListViewModelTests.swift
git commit -m "feat(ios): Group list, detail and create views"
```

### Task 26: Settings and Profile

**Files:**
- Create: `BoardGameTools/Features/Settings/SettingsView.swift`
- Create: `BoardGameTools/Features/Settings/ProfileView.swift`
- Modify: `BoardGameTools/App/MainTabView.swift` (add Settings tab)

- [ ] **Step 1: Write the failing build test**

```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Expected: FAIL with `Cannot find 'SettingsView' in scope`.

- [ ] **Step 2: Implement Settings and Profile**

Create `BoardGameTools/Features/Settings/SettingsView.swift`:
```swift
import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var appModel
    @State private var isLoggingOut = false

    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Profil") { ProfileView() }
                Section("Sync") {
                    HStack {
                        Text("Netzwerk")
                        Spacer()
                        Image(systemName: appModel.networkMonitor.isConnected ? "wifi" : "wifi.slash")
                            .foregroundStyle(appModel.networkMonitor.isConnected ? .green : .orange)
                    }
                    Button("Jetzt synchronisieren") {
                        Task { try? await appModel.syncEngine.push() }
                    }
                }
                Section {
                    Button("Abmelden") {
                        Task { await appModel.authManager.logout(); isLoggingOut = false }
                        isLoggingOut = true
                    }
                    .foregroundStyle(.red)
                }
            }
            .navigationTitle("Einstellungen")
        }
    }
}
```

Create `BoardGameTools/Features/Settings/ProfileView.swift`:
```swift
import SwiftUI

struct ProfileView: View {
    @Environment(AppModel.self) private var appModel
    @State private var user: UserDTO?
    @State private var isLoading = false

    var body: some View {
        Form {
            if let user {
                Section("Profil") {
                    LabeledContent("Name", value: user.name)
                    LabeledContent("E-Mail", value: user.email)
                }
            }
        }
        .navigationTitle("Profil")
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        do {
            user = try await appModel.apiClient.request(.profile)
        } catch {
            print(error)
        }
        isLoading = false
    }
}
```

Add `Endpoint.profile` in `BoardGameTools/API/Endpoint.swift`:
```swift
    case profile
```

And in the `path` switch:
```swift
        case .profile: "/api/mobile/profile"
```

Update `MainTabView.swift` to add the settings tab:
```swift
            SettingsView()
                .tabItem { Label("Einstellungen", systemImage: "gearshape") }
```

Run the build command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Settings BoardGameTools/App/MainTabView.swift BoardGameTools/API/Endpoint.swift
git commit -m "feat(ios): Settings and profile views"
```

### Task 27: Offline Handling

**Files:**
- Create: `BoardGameTools/Features/Shared/OfflineBanner.swift`
- Modify: `BoardGameTools/App/RootView.swift`
- Test: build only

- [ ] **Step 1: Write the failing build test**

```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Expected: FAIL with `Cannot find 'OfflineBanner' in scope`.

- [ ] **Step 2: Implement offline banner and sync-on-reconnect**

Create `BoardGameTools/Features/Shared/OfflineBanner.swift`:
```swift
import SwiftUI

struct OfflineBanner: View {
    let isConnected: Bool

    var body: some View {
        if !isConnected {
            HStack(spacing: 8) {
                Image(systemName: "wifi.slash")
                Text("Keine Verbindung. Änderungen werden lokal gespeichert.")
            }
            .font(.caption)
            .foregroundStyle(.white)
            .padding(8)
            .frame(maxWidth: .infinity)
            .background(Color.orange)
            .transition(.move(edge: .top))
        }
    }
}
```

Modify `BoardGameTools/App/RootView.swift`:
```swift
struct RootView: View {
    @Environment(AppModel.self) private var appModel
    @State private var publicEventToken: String?

    var body: some View {
        ZStack(alignment: .top) {
            Group {
                if appModel.authManager.isAuthenticated {
                    MainTabView()
                } else {
                    LoginView(viewModel: LoginViewModel(authManager: appModel.authManager))
                }
            }
            OfflineBanner(isConnected: appModel.networkMonitor.isConnected)
        }
        .sheet(isPresented: Binding(get: { publicEventToken != nil }, set: { if !$0 { publicEventToken = nil } })) {
            if let token = publicEventToken {
                NavigationStack {
                    PublicEventView(token: token)
                }
            }
        }
        .onChange(of: appModel.deepLinkHandler.pendingRoute) { _, route in
            if case .publicEvent(let token) = route {
                publicEventToken = token
                appModel.deepLinkHandler.pendingRoute = nil
            }
        }
        .onChange(of: appModel.networkMonitor.isConnected) { _, isConnected in
            if isConnected {
                Task { try? await appModel.syncEngine.push() }
            }
        }
    }
}
```

Run the build command.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add BoardGameTools/Features/Shared/OfflineBanner.swift BoardGameTools/App/RootView.swift
git commit -m "feat(ios): offline banner and sync on reconnect"
```

### Task 28: Final Integration, Configuration and Full Test Run

**Files:**
- Create: `BoardGameTools/BoardGameTools.entitlements`
- Modify: `BoardGameTools/Info.plist`
- Modify: `BoardGameTools/App/BoardGameToolsApp.swift` (if needed for URL scheme handling)
- Update project configuration for camera, Sign in with Apple, push notifications and URL types.

- [ ] **Step 1: Configure app capabilities and Info.plist**

Create `BoardGameTools/BoardGameTools.entitlements`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
    <key>com.apple.developer.usernotifications.filter</key>
    <true/>
</dict>
</plist>
```

Open the project in Xcode or edit `BoardGameTools/Info.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSCameraUsageDescription</key>
    <string>Kamera wird zum Scannen von Barcodes und Spielcovern verwendet.</string>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>com.boardgametools.app</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>boardgametools</string>
            </array>
        </dict>
    </array>
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
    </array>
</dict>
</plist>
```

In the project settings enable:
- **Signing & Capabilities**: Push Notifications, Background Modes (`fetch`, `remote notifications`), Sign in with Apple.
- **Associated Domains**: `applinks:boardgametools.vercel.app` (for universal links to public events).

- [ ] **Step 2: Run the full test suite and build**

```bash
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'platform=iOS Simulator,name=iPhone 16' test
```

Expected: BUILD SUCCEEDED, all tests PASS.

- [ ] **Step 3: Update changelog and documentation**

Update `src/lib/changelog.ts` (or a dedicated iOS changelog if introduced) with a feature entry. If this is the first iOS release, add an `internal` entry noting the new iOS client project under `BoardGameTools/`.

- [ ] **Step 4: Final commit**

```bash
git add BoardGameTools/BoardGameTools.entitlements BoardGameTools/Info.plist src/lib/changelog.ts
git commit -m "feat(ios): final integration, entitlements, Info.plist and full test run"
```

---

## Acceptance Criteria

- [ ] `BoardGameTools.xcodeproj` builds for iOS 17+ Simulator without compile errors.
- [ ] All unit tests under `BoardGameToolsTests/` pass (`xcodebuild test`).
- [ ] The app runs, logs in via e-mail and Sign in with Apple, and displays Dashboard data.
- [ ] Games, sessions, events and groups can be created/edited/deleted while offline and sync when connectivity returns.
- [ ] BGG import, barcode scanning and cover OCR create games.
- [ ] Deep links (`https://boardgametools.vercel.app/public/event/<token>` and `boardgametools://public/event/<token>`) open the public event flow.
- [ ] Push notification device tokens are registered after login and Info.plist/capabilities are configured.
