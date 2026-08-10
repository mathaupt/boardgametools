import Foundation

@Observable
@MainActor
final class SyncEngine {
    static let shared = SyncEngine()

    private let remote = RemoteDataSource.shared
    private let local: LocalDataSource

    private(set) var isSyncing = false
    private(set) var lastSyncedAt: String?
    private(set) var lastStatus: String?
    private(set) var errorMessage: String?

    private init() {
        local = LocalDataSource(context: PersistenceController.shared.mainContext)
    }

    func sync() async {
        guard !isSyncing else { return }
        isSyncing = true
        errorMessage = nil
        do {
            let payload = try await remote.sync()
            try apply(payload)
            try local.setLastSynced(at: payload.syncedAt, status: "success")
            try local.save()
            lastSyncedAt = payload.syncedAt
            lastStatus = "success"
        } catch let error as APIError {
            errorMessage = error.message
            lastStatus = "error"
        } catch {
            errorMessage = error.localizedDescription
            lastStatus = "error"
        }
        isSyncing = false
    }

    private func apply(_ payload: SyncPayload) throws {
        // Games
        for dto in payload.games.created + payload.games.updated {
            try local.upsertGame(dto)
        }
        for id in payload.games.deleted {
            try local.deleteGame(id: id)
        }

        // Sessions
        for dto in payload.sessions.created + payload.sessions.updated {
            try local.upsertSession(dto)
        }
        for id in payload.sessions.deleted {
            try local.deleteSession(id: id)
        }

        // Events
        for dto in payload.events.created + payload.events.updated {
            try local.upsertEvent(dto)
        }
        for id in payload.events.deleted {
            try local.deleteEvent(id: id)
        }

        // Groups
        for dto in payload.groups.created + payload.groups.updated {
            try local.upsertGroup(dto)
        }
        for id in payload.groups.deleted {
            try local.deleteGroup(id: id)
        }

        // Related entities are embedded in DTOs (proposals, date proposals, members, polls,
        // comments) and recreated via SwiftData relationships during upserts.
    }
}
