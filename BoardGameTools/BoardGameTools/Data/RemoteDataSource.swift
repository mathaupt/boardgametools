import Foundation

@MainActor
final class RemoteDataSource {
    static let shared = RemoteDataSource()

    private init() {}

    func sync() async throws -> SyncPayload {
        try await APIClient.shared.request(method: .get, endpoint: .sync)
    }

    func dashboard() async throws -> DashboardDTO {
        try await APIClient.shared.request(method: .get, endpoint: .dashboard)
    }

    func games() async throws -> [GameDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .games)
    }

    func createGame(_ input: GameInput) async throws -> GameDTO {
        try await APIClient.shared.request(method: .post, endpoint: .games, body: input)
    }

    func updateGame(id: String, _ input: GameInput) async throws -> GameDTO {
        try await APIClient.shared.request(method: .put, endpoint: .game(id), body: input)
    }

    func deleteGame(id: String) async throws {
        try await APIClient.shared.request(method: .delete, endpoint: .game(id))
    }

    func sessions() async throws -> [SessionDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .sessions)
    }

    func createSession(_ input: SessionInput) async throws -> SessionDTO {
        try await APIClient.shared.request(method: .post, endpoint: .sessions, body: input)
    }

    func updateSession(id: String, _ input: SessionInput) async throws -> SessionDTO {
        try await APIClient.shared.request(method: .put, endpoint: .session(id), body: input)
    }

    func deleteSession(id: String) async throws {
        try await APIClient.shared.request(method: .delete, endpoint: .session(id))
    }

    func events() async throws -> [EventDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .events)
    }

    func createEvent(_ input: EventInput) async throws -> EventDTO {
        try await APIClient.shared.request(method: .post, endpoint: .events, body: input)
    }

    func updateEvent(id: String, _ input: EventInput) async throws -> EventDTO {
        try await APIClient.shared.request(method: .put, endpoint: .event(id), body: input)
    }

    func deleteEvent(id: String) async throws {
        try await APIClient.shared.request(method: .delete, endpoint: .event(id))
    }

    func groups() async throws -> [GroupDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .groups)
    }

    func createGroup(_ input: GroupInput) async throws -> GroupDTO {
        try await APIClient.shared.request(method: .post, endpoint: .groups, body: input)
    }

    func updateGroup(id: String, _ input: GroupInput) async throws -> GroupDTO {
        try await APIClient.shared.request(method: .put, endpoint: .group(id), body: input)
    }

    func deleteGroup(id: String) async throws {
        try await APIClient.shared.request(method: .delete, endpoint: .group(id))
    }

    func bggSearch(query: String) async throws -> [BGGSearchResult] {
        try await APIClient.shared.request(method: .get, endpoint: .bggSearch(query: query))
    }

    func bggLookup(ean: String) async throws -> BGGSearchResult {
        struct Body: Encodable, Sendable {
            let ean: String
        }
        return try await APIClient.shared.request(method: .post, endpoint: .bggLookup, body: Body(ean: ean))
    }

    func bggImport(bggId: String) async throws -> GameDTO {
        struct Body: Encodable, Sendable {
            let bggId: String
        }
        return try await APIClient.shared.request(method: .post, endpoint: .bggImport, body: Body(bggId: bggId))
    }
}
