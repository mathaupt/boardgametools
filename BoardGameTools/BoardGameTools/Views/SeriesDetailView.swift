import SwiftUI
import SwiftData

struct SeriesDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    let series: LocalGameSeries

    @State private var isShowingEditSheet = false
    @State private var isShowingAddEntrySheet = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var sortedEntries: [LocalGameSeriesEntry] {
        (series.entries ?? []).sorted { $0.sortOrder < $1.sortOrder }
    }

    private var progress: Double {
        let total = sortedEntries.count
        let played = sortedEntries.filter { $0.played }.count
        return total > 0 ? Double(played) / Double(total) : 0
    }

    private func game(for entry: LocalGameSeriesEntry) -> LocalGame? {
        localGames.first { $0.id == entry.gameId }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if !networkMonitor.isOnline {
                    OfflineBanner()
                        .padding(.horizontal)
                }

                // Header
                VStack(spacing: 12) {
                    GameCover(imageUrl: series.imageUrl, name: series.name)
                        .frame(width: 120, height: 150)

                    Text(series.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)

                    if let desc = series.desc, !desc.isEmpty {
                        Text(desc)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    VStack(spacing: 8) {
                        HStack {
                            Text("Fortschritt")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Spacer()
                            Text("\(sortedEntries.filter { $0.played }.count) / \(sortedEntries.count) gespielt")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        ProgressView(value: progress)
                            .tint(Theme.primaryGradient)
                            .scaleEffect(x: 1, y: 2, anchor: .center)
                    }
                    .padding()
                    .background(Theme.cardBackground)
                    .clipShape(.rect(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 4)
                }
                .padding(.horizontal)

                // Entries
                LazyVStack(spacing: 12) {
                    ForEach(sortedEntries) { entry in
                        SeriesEntryRow(
                            entry: entry,
                            game: game(for: entry),
                            onTogglePlayed: { markPlayed(entry, played: !entry.played) },
                            onRate: { rating in rateEntry(entry, rating: rating) },
                            onDelete: { deleteEntry(entry) }
                        )
                    }
                }
                .padding(.horizontal)

                Button {
                    isShowingAddEntrySheet = true
                } label: {
                    Label("Spiel hinzufügen", systemImage: "plus")
                        .themeGradientButton()
                }
                .padding(.horizontal)
                .accessibilityLabel("Spiel zur Reihe hinzufügen")
            }
            .padding(.vertical)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Reihe")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isShowingEditSheet = true
                } label: {
                    Image(systemName: "pencil")
                        .font(.title3)
                }
                .accessibilityLabel("Reihe bearbeiten")
            }
        }
        .sheet(isPresented: $isShowingEditSheet) {
            SeriesEditView(series: series)
                .presentationDetents([.large])
        }
        .sheet(isPresented: $isShowingAddEntrySheet) {
            AddSeriesEntrySheet(series: series)
                .presentationDetents([.large])
        }
        .overlay {
            if isLoading {
                LoadingOverlay(message: "Speichert...")
            } else if let errorMessage = errorMessage {
                EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
            }
        }
    }

    private func markPlayed(_ entry: LocalGameSeriesEntry, played: Bool) {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                let input = SeriesEntryUpdateInput(
                    played: played,
                    playedAt: played ? iso8601Now() : nil,
                    rating: nil,
                    difficulty: nil,
                    playTimeMinutes: nil,
                    successful: nil,
                    playerCount: nil,
                    score: nil
                )
                _ = try await RemoteDataSource.shared.updateSeriesEntry(seriesId: series.id, entryId: entry.id, input)
                await syncEngine.sync()
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func rateEntry(_ entry: LocalGameSeriesEntry, rating: Int) {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                let input = SeriesEntryUpdateInput(
                    played: nil,
                    playedAt: nil,
                    rating: rating,
                    difficulty: nil,
                    playTimeMinutes: nil,
                    successful: nil,
                    playerCount: nil,
                    score: nil
                )
                _ = try await RemoteDataSource.shared.updateSeriesEntry(seriesId: series.id, entryId: entry.id, input)
                await syncEngine.sync()
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func deleteEntry(_ entry: LocalGameSeriesEntry) {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                try await RemoteDataSource.shared.deleteSeriesEntry(seriesId: series.id, entryId: entry.id)
                await syncEngine.sync()
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func iso8601Now() -> String {
        let formatter = ISO8601DateFormatter()
        return formatter.string(from: Date())
    }
}

struct SeriesEntryRow: View {
    let entry: LocalGameSeriesEntry
    let game: LocalGame?
    let onTogglePlayed: () -> Void
    let onRate: (Int) -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            GameCover(imageUrl: game?.imageUrl, name: game?.name ?? entry.gameId)
                .frame(width: 56, height: 70)

            VStack(alignment: .leading, spacing: 6) {
                Text(game?.name ?? "Unbekanntes Spiel")
                    .font(.headline)
                    .lineLimit(1)

                if let difficulty = entry.difficulty, !difficulty.isEmpty {
                    Text(difficulty)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 2) {
                    ForEach(1...5, id: \.self) { index in
                        Button {
                            onRate(index)
                        } label: {
                            Image(systemName: index <= (entry.rating ?? 0) ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundStyle(index <= (entry.rating ?? 0) ? Theme.secondary : .gray.opacity(0.4))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Bewertung \(index) Sterne")
                    }
                }
            }

            Spacer()

            Button {
                onTogglePlayed()
            } label: {
                Image(systemName: entry.played ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(entry.played ? Theme.success : .gray.opacity(0.4))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(entry.played ? "Gespielt" : "Als gespielt markieren")
        }
        .padding()
        .background(Theme.cardBackground)
        .clipShape(.rect(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 4)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Löschen", systemImage: "trash")
            }
        }
    }
}
