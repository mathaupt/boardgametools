import Foundation
import SwiftData

#if !CONTRACT_TEST_RUNNER
import Testing
@testable import BoardGameTools
#endif

private enum RegressionFailure: Error {
    case failed(String)
}

private func require(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
    if try !condition() { throw RegressionFailure.failed(message) }
}

private func checkContracts() throws {
    let decoder = JSONDecoder()
    let refresh = Data(#"{"accessToken":"access","refreshToken":"refresh","expiresAt":"2026-10-29T00:00:00Z"}"#.utf8)
    let tokens = try decoder.decode(RefreshTokenResponse.self, from: refresh)
    try require(tokens.accessToken == "access" && tokens.refreshToken == "refresh", "refresh tokens")
    let entry = Data(#"{"id":"e","seriesId":"s","gameId":"g","sortOrder":0,"played":false,"createdAt":"now","updatedAt":"now","game":{"imageUrl":"https://example.com/cover.png"}}"#.utf8)
    let seriesEntry = try decoder.decode(SeriesEntryDTO.self, from: entry)
    try require(seriesEntry.game?.imageUrl == "https://example.com/cover.png", "series game summary")
    let upload = Data(#"{"id":"u","url":"https://example.com/a.png","fileName":"a.png","mimeType":"image/png","sizeBytes":20}"#.utf8)
    let result = try decoder.decode(UploadResponse.self, from: upload)
    try require(result.url == "https://example.com/a.png", "uploaded image URL")
    // Login must still require the user; a refresh response is not a valid login response.
    do {
        _ = try decoder.decode(TokenResponse.self, from: refresh)
        throw RegressionFailure.failed("login accepted missing user")
    } catch is DecodingError { }
}

@MainActor
private func checkAccountIsolation() throws {
    let persistence = PersistenceController(isStoredInMemoryOnly: true)
    let suite = "bgt-tests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defer { defaults.removePersistentDomain(forName: suite) }
    let accounts = LocalAccountStore(context: persistence.mainContext, defaults: defaults)
    let context = persistence.mainContext
    let game = try JSONDecoder().decode(GameDTO.self, from: Data(#"{"id":"g1","name":"Azul","minPlayers":2,"maxPlayers":4,"createdAt":"now","updatedAt":"now"}"#.utf8))

    // Old installations have no trustworthy cache owner. Discard that legacy cache.
    context.insert(LocalGame(dto: game))
    try context.save()
    try require(try accounts.restore(server: "https://one.example") == false, "legacy session restored")
    try require(try context.fetchCount(FetchDescriptor<LocalGame>()) == 0, "legacy cache survived")

    try accounts.activate(server: "https://one.example", userID: "alice")
    context.insert(LocalGame(dto: game))
    context.insert(LocalSyncMetadata(key: "default"))
    try context.save()
    try require(try accounts.restore(server: "https://one.example"), "same backend could not restore")
    try accounts.activate(server: "https://one.example", userID: "alice")
    try require(try context.fetchCount(FetchDescriptor<LocalGame>()) == 1, "same account lost cache")

    try accounts.activate(server: "https://one.example", userID: "bob")
    try require(try context.fetchCount(FetchDescriptor<LocalGame>()) == 0, "Alice data visible to Bob")
    try require(try context.fetchCount(FetchDescriptor<LocalSyncMetadata>()) == 0, "old sync state survived")
    context.insert(LocalGame(dto: game))
    try context.save()
    try accounts.activate(server: "https://two.example", userID: "bob")
    try require(try context.fetchCount(FetchDescriptor<LocalGame>()) == 0, "other backend data survived")
    context.insert(LocalGame(dto: game))
    try context.save()
    try accounts.clear()
    try require(try context.fetchCount(FetchDescriptor<LocalGame>()) == 0, "logout retained cache")
    try require(try accounts.restore(server: "https://two.example") == false, "logout retained owner")
}

private actor MemoryTokens: TokenStorage {
    var access: String? = "old-access"
    var refresh: String? = "old-refresh"
    func readAccessToken() -> String? { access }
    func readRefreshToken() -> String? { refresh }
    func saveAccessToken(_ token: String) throws { try Task.checkCancellation(); access = token }
    func saveRefreshToken(_ token: String) throws { try Task.checkCancellation(); refresh = token }
    func clearTokens() { access = nil; refresh = nil }
}

private final class HTTPState: @unchecked Sendable {
    let lock = NSLock()
    var refreshCalls = 0
    var gameCalls = 0
    var hosts: [String] = []
    var rejectRefresh = false
    var rejectNewAccess = false
    var delayGames = false

    func response(for request: URLRequest) -> (Int, String) {
        lock.lock()
        defer { lock.unlock() }
        hosts.append(request.url!.host!)
        if request.url!.path.hasSuffix("/auth/refresh") {
            refreshCalls += 1
            Thread.sleep(forTimeInterval: 0.05)
            return rejectRefresh ? (401, "{}") : (200, #"{"accessToken":"new-access","refreshToken":"new-refresh","expiresAt":"2026-10-29T00:00:00Z"}"#)
        }
        if request.url!.path.hasSuffix("/auth/logout") { return (200, "{}") }
        gameCalls += 1
        if delayGames { Thread.sleep(forTimeInterval: 0.1) }
        if rejectNewAccess || request.value(forHTTPHeaderField: "Authorization") == "Bearer old-access" {
            return (401, "{}")
        }
        return (200, "[]")
    }
}

private final class ContractURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var state = HTTPState()
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let (status, json) = Self.state.response(for: request)
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(json.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() { }
}

@MainActor
private func checkAuthenticationRequests() async throws {
    func makeClient(state: HTTPState, tokens: MemoryTokens) -> APIClient {
        ContractURLProtocol.state = state
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [ContractURLProtocol.self]
        return APIClient(baseURL: URL(string: "https://old.example")!, session: URLSession(configuration: config), tokens: tokens)
    }
    func load(_ api: APIClient) async throws -> [GameDTO] {
        try await api.request(method: .get, endpoint: .games)
    }
    let tokens = MemoryTokens()
    let state = HTTPState()
    let api = makeClient(state: state, tokens: tokens)
    async let first = load(api)
    async let second = load(api)
    _ = try await (first, second)
    try require(state.refreshCalls == 1, "concurrent requests rotated tokens twice")
    let newAccess = await tokens.readAccessToken()
    let newRefresh = await tokens.readRefreshToken()
    try require(newAccess == "new-access" && newRefresh == "new-refresh", "refresh pair was not saved")

    let deniedState = HTTPState()
    deniedState.rejectRefresh = true
    let deniedTokens = MemoryTokens()
    let deniedAPI = makeClient(state: deniedState, tokens: deniedTokens)
    async let deniedFirst: Void = expectUnauthorized(deniedAPI)
    async let deniedSecond: Void = expectUnauthorized(deniedAPI)
    try await deniedFirst
    try await deniedSecond
    try require(deniedState.refreshCalls == 1, "refresh failure was not shared")
    let clearedAccess = await deniedTokens.readAccessToken()
    try require(clearedAccess == nil, "invalid refresh did not clear tokens")

    let retryState = HTTPState()
    retryState.rejectNewAccess = true
    let retryAPI = makeClient(state: retryState, tokens: MemoryTokens())
    try await expectUnauthorized(retryAPI)
    try require(retryState.refreshCalls == 1 && retryState.gameCalls == 2, "unbounded 401 retry")

    let staleState = HTTPState()
    staleState.delayGames = true
    let staleTokens = MemoryTokens()
    try await staleTokens.saveAccessToken("valid-access")
    let staleAPI = makeClient(state: staleState, tokens: staleTokens)
    let pending = Task { try await load(staleAPI) }
    try await Task.sleep(for: .milliseconds(20))
    staleAPI.invalidateSession()
    do {
        _ = try await pending.value
        throw RegressionFailure.failed("old session response accepted")
    } catch APIError.cancelled { }

    let cancelledState = HTTPState()
    let cancelledTokens = MemoryTokens()
    let cancelledAPI = makeClient(state: cancelledState, tokens: cancelledTokens)
    let refreshing = Task { try await load(cancelledAPI) }
    try await Task.sleep(for: .milliseconds(20))
    cancelledAPI.invalidateSession()
    await cancelledTokens.clearTokens()
    do {
        _ = try await refreshing.value
        throw RegressionFailure.failed("cancelled refresh succeeded")
    } catch APIError.cancelled { }
      catch is CancellationError { }
    let staleAccess = await cancelledTokens.readAccessToken()
    let staleRefresh = await cancelledTokens.readRefreshToken()
    try require(staleAccess == nil && staleRefresh == nil, "old refresh restored logged-out tokens")

    let switchState = HTTPState()
    let switchTokens = MemoryTokens()
    let switchAPI = makeClient(state: switchState, tokens: switchTokens)
    let persistence = PersistenceController(isStoredInMemoryOnly: true)
    let suite = "bgt-auth-tests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defer { defaults.removePersistentDomain(forName: suite) }
    let accounts = LocalAccountStore(context: persistence.mainContext, defaults: defaults)
    try accounts.activate(server: switchAPI.baseURL.absoluteString, userID: "alice")
    let auth = AuthManager(apiClient: switchAPI, tokens: switchTokens, accounts: accounts, restoreSession: false, invalidateSync: {})
    try await auth.changeBackend(to: URL(string: "https://new.example")!)
    try require(switchState.hosts == ["old.example"], "logout was sent to the new backend")
    try require(switchAPI.baseURL.host == "new.example", "backend switch failed")
    let loggedOut = await switchTokens.readAccessToken()
    try require(loggedOut == nil && !auth.isAuthenticated, "backend switch retained session")
}

@MainActor
private func expectUnauthorized(_ api: APIClient) async throws {
    do {
        let _: [GameDTO] = try await api.request(method: .get, endpoint: .games)
        throw RegressionFailure.failed("unauthorized request succeeded")
    } catch APIError.unauthorized { }
}

#if CONTRACT_TEST_RUNNER
@main struct ContractTestRunner {
    @MainActor static func main() async throws {
        try checkContracts()
        print("PASS: refresh, series, upload and strict login contracts")
        try checkAccountIsolation()
        print("PASS: legacy cache, same account, second account, backend switch and logout")
        try await checkAuthenticationRequests()
        print("PASS: concurrent refresh, failed refresh, bounded retry, stale response and old-server logout")
    }
}
#else
struct BoardGameToolsTests {
    @Test func mobileResponseContracts() throws { try checkContracts() }
    @Test @MainActor func accountCacheIsolation() throws { try checkAccountIsolation() }
    @Test @MainActor func authenticationRequests() async throws { try await checkAuthenticationRequests() }
}
#endif
