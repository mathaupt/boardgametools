import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "square.grid.2x2") }

            GameListView()
                .tabItem { Label("Spiele", systemImage: "dice") }

            SessionListView()
                .tabItem { Label("Sessions", systemImage: "calendar") }

            EventListView()
                .tabItem { Label("Events", systemImage: "person.3") }

            GroupListView()
                .tabItem { Label("Gruppen", systemImage: "person.2") }

            SettingsView()
                .tabItem { Label("Einstellungen", systemImage: "gearshape") }
        }
        .tint(Theme.primary)
    }
}
