import SwiftUI
import SwiftData

@main
struct BoardGameToolsApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AuthManager.shared)
                .environment(APIClient.shared)
                .environment(SyncEngine.shared)
                .environment(NetworkMonitor.shared)
                .environment(\.modelContext, persistenceController.mainContext)
                .tint(Theme.primary)
        }
        .modelContainer(persistenceController.container)
    }
}
