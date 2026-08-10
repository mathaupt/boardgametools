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

    func events() async throws -> [EventDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .events)
    }

    func groups() async throws -> [GroupDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .groups)
    }

    func bggSearch(query: String) async throws -> [BGGSearchResult] {
        try await APIClient.shared.request(method: .get, endpoint: .bggSearch(query: query))
    }

    func bggImport(bggId: String) async throws -> GameDTO {
        struct Body: Encodable, Sendable {
            let bggId: String
        }
        return try await APIClient.shared.request(method: .post, endpoint: .bggImport, body: Body(bggId: bggId))
    }
}
