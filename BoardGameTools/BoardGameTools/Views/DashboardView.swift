import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query private var games: [LocalGame]
    @Query private var sessions: [LocalSession]
    @Query private var events: [LocalEvent]
    @Query private var groups: [LocalGroup]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if !networkMonitor.isOnline {
                        OfflineBanner()
                    }

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        NavigationLink(destination: GameListView()) {
                            DashboardTile(title: "Spiele", value: games.count, icon: "dice.fill", gradient: Theme.primaryGradient)
                        }
                        .buttonStyle(.plain)

                        NavigationLink(destination: SessionListView()) {
                            DashboardTile(title: "Sessions", value: sessions.count, icon: "dice.gamedots", gradient: Theme.warmGradient)
                        }
                        .buttonStyle(.plain)

                        NavigationLink(destination: EventListView()) {
                            DashboardTile(title: "Events", value: events.count, icon: "calendar.badge.sparkles", gradient: Theme.roseGradient)
                        }
                        .buttonStyle(.plain)

                        NavigationLink(destination: GroupListView()) {
                            DashboardTile(title: "Gruppen", value: groups.count, icon: "person.3.fill", gradient: Theme.coolGradient)
                        }
                        .buttonStyle(.plain)
                    }

                    if syncEngine.isSyncing {
                        HStack(spacing: 8) {
                            ProgressView()
                                .tint(.secondary)
                            Text("Synchronisiere...")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(.thinMaterial)
                        .clipShape(.capsule)
                    }

                    if let lastSyncedAt = syncEngine.lastSyncedAt, !syncEngine.isSyncing {
                        Label("Zuletzt synchronisiert: \(lastSyncedAt.formattedISO8601() ?? lastSyncedAt)", systemImage: "checkmark.circle")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .padding(.horizontal)
                    }
                }
                .padding()
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Dashboard")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct OfflineBanner: View {
    var body: some View {
        HStack {
            Image(systemName: "wifi.slash")
            Text("Offline-Modus — Daten werden lokal angezeigt")
                .font(.caption)
            Spacer()
        }
        .padding()
        .background(Theme.warning.opacity(0.15))
        .foregroundStyle(Theme.warning)
        .clipShape(.rect(cornerRadius: 12))
    }
}

struct DashboardTile: View {
    let title: String
    let value: Int
    let icon: String
    let gradient: LinearGradient

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Spacer()
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(.white.opacity(0.9))
            }

            Text("\(value)")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(.white)

            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.white.opacity(0.9))
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(gradient)
        .clipShape(.rect(cornerRadius: 20))
        .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
    }
}
