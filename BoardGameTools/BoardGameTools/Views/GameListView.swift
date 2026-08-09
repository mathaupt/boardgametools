import SwiftUI

struct GameListView: View {
    @State private var games: [GameDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(games) { game in
                NavigationLink(destination: GameDetailView(game: game)) {
                    GameRow(game: game)
                }
            }
            .navigationTitle("Spiele")
            .task { await load() }
            .refreshable { await load() }
            .overlay {
                if isLoading {
                    ProgressView()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                } else if games.isEmpty {
                    Text("Noch keine Spiele")
                }
            }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            games = try await APIClient.shared.request(method: .get, endpoint: .games)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
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
