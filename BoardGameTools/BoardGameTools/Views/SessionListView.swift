import SwiftUI
import SwiftData

struct SessionListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalSession.playedAt, order: .reverse) private var localSessions: [LocalSession]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(localSessions.map { $0.toDTO() }) { session in
                SessionRow(session: session)
            }
            .navigationTitle("Sessions")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localSessions.isEmpty {
                    ProgressView()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                } else if localSessions.isEmpty {
                    Text("Noch keine Sessions")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct SessionRow: View {
    let session: SessionDTO

    var body: some View {
        VStack(alignment: .leading) {
            Text(session.playedAt.formattedISO8601() ?? session.playedAt)
                .font(.headline)
            Text("\(session.players.count) Spieler")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
