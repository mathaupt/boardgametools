import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query private var games: [LocalGame]
    @Query private var sessions: [LocalSession]
    @Query private var events: [LocalEvent]
    @Query private var groups: [LocalGroup]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    DashboardTile(title: "Spiele", value: games.count, icon: "dice")
                    DashboardTile(title: "Sessions", value: sessions.count, icon: "calendar")
                    DashboardTile(title: "Events", value: events.count, icon: "person.3")
                    DashboardTile(title: "Gruppen", value: groups.count, icon: "person.2")

                    if syncEngine.isSyncing {
                        ProgressView()
                            .padding()
                    }

                    if let lastSyncedAt = syncEngine.lastSyncedAt {
                        Text("Zuletzt synchronisiert: \(lastSyncedAt.formattedISO8601() ?? lastSyncedAt)")
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
            .navigationTitle("Dashboard")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct DashboardTile: View {
    let title: String
    let value: Int
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .frame(width: 44)
            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                Text("\(value)")
                    .font(.title)
                    .fontWeight(.bold)
            }
            Spacer()
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(.rect(cornerRadius: 12))
    }
}
