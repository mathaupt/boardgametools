import SwiftUI
import SwiftData

struct AddSeriesEntrySheet: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(\.dismiss) private var dismiss
    let series: LocalGameSeries

    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var filteredGames: [LocalGame] {
        let existingGameIds = Set((series.entries ?? []).map { $0.gameId })
        return localGames
            .filter { !existingGameIds.contains($0.id) }
            .filter { searchText.isEmpty || $0.name.localizedStandardContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            List {
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }

                ForEach(filteredGames) { game in
                    Button {
                        addEntry(gameId: game.id)
                    } label: {
                        HStack(spacing: 12) {
                            GameCover(imageUrl: game.imageUrl, name: game.name)
                                .frame(width: 48, height: 60)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(game.name)
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                Text("\(game.minPlayers)–\(game.maxPlayers) Spieler")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Spiel \(game.name) hinzufügen")
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Spiel zur Reihe hinzufügen")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Spiel suchen")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") { dismiss() }
                }
            }
            .overlay {
                if isLoading {
                    LoadingOverlay(message: "Hinzufügen...")
                } else if filteredGames.isEmpty && !localGames.isEmpty {
                    EmptyStateView(icon: "dice", title: "Keine Spiele", subtitle: "Alle deine Spiele sind bereits in dieser Reihe.")
                } else if localGames.isEmpty {
                    EmptyStateView(icon: "dice", title: "Noch keine Spiele", subtitle: "Füge zuerst Spiele hinzu, bevor du sie einer Reihe zuordnest.")
                }
            }
        }
    }

    private func addEntry(gameId: String) {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                _ = try await RemoteDataSource.shared.addSeriesEntry(seriesId: series.id, gameId: gameId)
                await syncEngine.sync()
                dismiss()
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
