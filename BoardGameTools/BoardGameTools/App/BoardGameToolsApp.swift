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
                .environment(\.modelContext, persistenceController.mainContext)
        }
        .modelContainer(persistenceController.container)
    }
}
