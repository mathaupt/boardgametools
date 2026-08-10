import Foundation
import SwiftData

@MainActor
final class PersistenceController {
    static let shared = PersistenceController()

    let container: ModelContainer
    let mainContext: ModelContext

    private init() {
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
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
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

        try mainContext.save()
    }
}
