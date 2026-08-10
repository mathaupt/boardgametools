import SwiftUI
import SwiftData

@main
struct BoardGameToolsApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AuthManager.shared)
                .environment(APIClient.shared)
                .environment(SyncEngine.shared)
                .environment(NetworkMonitor.shared)
                .environment(DeepLinkManager.shared)
                .environment(\.modelContext, persistenceController.mainContext)
                .onOpenURL { url in
                    DeepLinkManager.shared.handle(url: url)
                }
                .tint(Theme.primary)
        }
        .modelContainer(persistenceController.container)
    }
}
