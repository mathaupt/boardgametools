import SwiftUI
import SwiftData

struct GameListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(localGames.map { $0.toDTO() }) { game in
                NavigationLink(destination: GameDetailView(game: game)) {
                    GameRow(game: game)
                }
            }
            .navigationTitle("Spiele")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localGames.isEmpty {
                    ProgressView()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                } else if localGames.isEmpty {
                    Text("Noch keine Spiele")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GameRow: View {
    let game: GameDTO

    var body: some View {
        VStack(alignment: .leading) {
            Text(game.name)
                .font(.headline)
            if let time = game.playTimeMinutes {
                Text("\(game.minPlayers) - \(game.maxPlayers) Spieler · \(time) Min")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("\(game.minPlayers) - \(game.maxPlayers) Spieler")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
