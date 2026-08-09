import SwiftUI
import SwiftData

@main
struct BoardGameToolsApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AuthManager.shared)
                .environment(APIClient.shared)
        }
        .modelContainer(for: [
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
    }
}
