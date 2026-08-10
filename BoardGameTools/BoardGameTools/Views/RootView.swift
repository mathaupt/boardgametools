import SwiftUI

struct RootView: View {
    @Environment(AuthManager.self) private var authManager
    @Environment(DeepLinkManager.self) private var deepLinkManager
    @State private var activeDeepLink: DeepLink?

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .onChange(of: deepLinkManager.currentTarget) { _, new in
            activeDeepLink = new
        }
        .sheet(item: $activeDeepLink) { link in
            DeepLinkSheet(link: link) {
                activeDeepLink = nil
                deepLinkManager.clear()
            }
        }
    }
}

struct DeepLinkSheet: View {
    let link: DeepLink
    let onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            switch link {
            case .publicEvent(let token):
                PublicEventView(token: token)
            case .event(let id):
                Text("Event \(id) wird geladen...")
                    .navigationTitle("Event")
            case .game(let id):
                Text("Spiel \(id) wird geladen...")
                    .navigationTitle("Spiel")
            }
        }
    }
}
