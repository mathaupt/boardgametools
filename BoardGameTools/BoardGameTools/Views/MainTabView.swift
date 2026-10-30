import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Übersicht", systemImage: "house") }

            GameListView()
                .tabItem { Label("Spiele", systemImage: "dice") }

            SessionListView()
                .tabItem { Label("Sessions", systemImage: "calendar") }

            EventListView()
                .tabItem { Label("Spieleabende", systemImage: "calendar") }

            MoreView()
                .tabItem { Label("Mehr", systemImage: "ellipsis") }
        }
        .tint(ClubTheme.tint)
        .task {
            await NotificationManager.shared.requestAuthorization()
        }
    }
}

struct MoreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Gemeinsam spielen") {
                    NavigationLink { GroupListView() } label: {
                        Label("Gruppen", systemImage: "person.2")
                    }
                    NavigationLink { SeriesListView() } label: {
                        Label("Spielereihen", systemImage: "rectangle.stack")
                    }
                }
                Section("Dein Konto") {
                    NavigationLink { SettingsView() } label: {
                        Label("Einstellungen", systemImage: "gearshape")
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(ClubTheme.background)
            .navigationTitle("Mehr")
        }
    }
}
