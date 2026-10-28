import Foundation
import SwiftData

@MainActor
final class PersistenceController {
    static let shared = PersistenceController()

    let container: ModelContainer
    let mainContext: ModelContext

    init(isStoredInMemoryOnly: Bool = false) {
        let schema = Schema([
            LocalGame.self,
            LocalSession.self,
            LocalSessionPlayer.self,
            LocalEvent.self,
            LocalEventProposal.self,
            LocalDateProposal.self,
            LocalDateVote.self,
            LocalVote.self,
            LocalGroup.self,
            LocalGroupMember.self,
            LocalGroupPoll.self,
            LocalGroupPollOption.self,
            LocalGroupPollVote.self,
            LocalGroupComment.self,
            LocalUser.self,
            LocalSyncMetadata.self,
            LocalGameSeries.self,
            LocalGameSeriesEntry.self,
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: isStoredInMemoryOnly)
        do {
            container = try ModelContainer(for: schema, configurations: [config])
            mainContext = container.mainContext
            try deduplicateAll()
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }

    private func deduplicate<T: PersistentModel>(_: T.Type, id keyPath: KeyPath<T, String>) throws {
        let all = try mainContext.fetch(FetchDescriptor<T>())
        var seen = Set<String>()
        for item in all {
            let itemId = item[keyPath: keyPath]
            if !seen.insert(itemId).inserted {
                mainContext.delete(item)
            }
        }
    }

    private func deduplicateAll() throws {
        try deduplicate(LocalGame.self, id: \.id)
        try deduplicate(LocalSession.self, id: \.id)
        try deduplicate(LocalEvent.self, id: \.id)
        try deduplicate(LocalEventProposal.self, id: \.id)
        try deduplicate(LocalDateProposal.self, id: \.id)
        try deduplicate(LocalDateVote.self, id: \.id)
        try deduplicate(LocalVote.self, id: \.id)
        try deduplicate(LocalGroup.self, id: \.id)
        try deduplicate(LocalGroupMember.self, id: \.id)
        try deduplicate(LocalGroupPoll.self, id: \.id)
        try deduplicate(LocalGroupPollOption.self, id: \.id)
        try deduplicate(LocalGroupPollVote.self, id: \.id)
        try deduplicate(LocalGroupComment.self, id: \.id)
        try deduplicate(LocalUser.self, id: \.id)
        try deduplicate(LocalGameSeries.self, id: \.id)
        try deduplicate(LocalGameSeriesEntry.self, id: \.id)

        try mainContext.save()
    }
}

/// The cache belongs to one server/account pair. Unknown legacy ownership fails closed.
@MainActor
final class LocalAccountStore {
    static let shared = LocalAccountStore(context: PersistenceController.shared.mainContext)

    private let context: ModelContext
    private let defaults: UserDefaults
    private let ownerKey = "local_cache_owner_v1"

    init(context: ModelContext, defaults: UserDefaults = .standard) {
        self.context = context
        self.defaults = defaults
    }

    func restore(server: String) throws -> Bool {
        guard let owner = defaults.stringArray(forKey: ownerKey),
              owner.count == 2, owner[0] == server else {
            try clear()
            return false
        }
        return true
    }

    func activate(server: String, userID: String) throws {
        let owner = [server, userID]
        if defaults.stringArray(forKey: ownerKey) != owner {
            try clear()
            defaults.set(owner, forKey: ownerKey)
        }
    }

    func clear() throws {
        // Invalidate ownership first. A failed cleanup must never restore this cache.
        defaults.removeObject(forKey: ownerKey)
        context.rollback()
        try remove(LocalGameSeriesEntry.self)
        try remove(LocalGameSeries.self)
        try remove(LocalSessionPlayer.self)
        try remove(LocalSession.self)
        try remove(LocalVote.self)
        try remove(LocalDateVote.self)
        try remove(LocalDateProposal.self)
        try remove(LocalEventProposal.self)
        try remove(LocalEvent.self)
        try remove(LocalGroupPollVote.self)
        try remove(LocalGroupPollOption.self)
        try remove(LocalGroupPoll.self)
        try remove(LocalGroupComment.self)
        try remove(LocalGroupMember.self)
        try remove(LocalGroup.self)
        try remove(LocalGame.self)
        try remove(LocalUser.self)
        try remove(LocalSyncMetadata.self)
        try context.save()
    }

    private func remove<T: PersistentModel>(_ type: T.Type) throws {
        for record in try context.fetch(FetchDescriptor<T>()) {
            context.delete(record)
        }
    }
}
