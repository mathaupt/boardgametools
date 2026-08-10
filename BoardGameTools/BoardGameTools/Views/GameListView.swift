import SwiftUI
import SwiftData

struct GameListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    @State private var isShowingAddSheet = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                if !networkMonitor.isOnline {
                    OfflineBanner()
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }

                ForEach(localGames) { game in
                    NavigationLink(destination: GameDetailView(game: game.toDTO())) {
                        GameRow(game: game)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Theme.cardBackground)
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Spiele")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Theme.primaryGradient)
                    }
                }
            }
            .sheet(isPresented: $isShowingAddSheet) {
                GameAddSheet()
                    .presentationDetents([.large])
            }
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localGames.isEmpty {
                    LoadingOverlay(message: "Lade Spiele...")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if localGames.isEmpty && !syncEngine.isSyncing {
                    EmptyStateView(icon: "dice", title: "Noch keine Spiele", subtitle: "Füge dein erstes Spiel hinzu oder synchronisiere deine Sammlung.")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GameRow: View {
    let game: LocalGame

    var body: some View {
        HStack(spacing: 16) {
            GameCover(imageUrl: game.imageUrl, name: game.name)

            VStack(alignment: .leading, spacing: 4) {
                Text(game.name)
                    .font(.headline)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                    Text("\(game.minPlayers)–\(game.maxPlayers)")
                    if let time = game.playTimeMinutes {
                        Text("·")
                        Image(systemName: "clock")
                        Text("\(time) min")
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                if let complexity = game.complexity {
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { index in
                            Image(systemName: index <= complexity ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundStyle(index <= complexity ? Theme.secondary : .gray.opacity(0.4))
                        }
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct GameCover: View {
    let imageUrl: String?
    let name: String

    var body: some View {
        ZStack {
            if let imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    case .failure, .empty:
                        placeholder
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: 64, height: 80)
        .clipShape(.rect(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }

    private var placeholder: some View {
        Theme.primaryGradient
            .overlay(
                Image(systemName: "dice")
                    .font(.title2)
                    .foregroundStyle(.white.opacity(0.7))
            )
    }
}
