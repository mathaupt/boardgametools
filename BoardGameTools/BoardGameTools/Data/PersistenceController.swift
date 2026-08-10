import Foundation
import SwiftData

@MainActor
final class PersistenceController {
    static let shared = PersistenceController()

    let container: ModelContainer

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
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }

    var mainContext: ModelContext {
        container.mainContext
    }
}
