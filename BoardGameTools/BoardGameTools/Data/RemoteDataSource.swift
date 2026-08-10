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

    func sessions() async throws -> [SessionDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .sessions)
    }

    func events() async throws -> [EventDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .events)
    }

    func groups() async throws -> [GroupDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .groups)
    }
}
