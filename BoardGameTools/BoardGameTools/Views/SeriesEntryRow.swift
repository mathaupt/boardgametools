import SwiftUI

struct SeriesEntryRow: View {
    let entry: LocalGameSeriesEntry
    let game: LocalGame?
    let onTogglePlayed: () -> Void
    let onRate: (Int) -> Void
    let onDelete: () -> Void
    @Environment(SyncEngine.self) private var syncEngine
    @State private var collecting = false
    @State private var collectionError: String?
    @State private var confirmingDelete = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                GameCover(imageUrl: game?.imageUrl ?? entry.gameImageUrl, name: game?.name ?? entry.gameName ?? "Spiel")
                    .frame(width: 48, height: 60)
                VStack(alignment: .leading, spacing: 6) {
                    Text(game?.name ?? entry.gameName ?? "Unbekanntes Spiel").font(.headline)
                    if let difficulty = entry.difficulty, !difficulty.isEmpty { Text(difficulty).font(.subheadline).foregroundStyle(.secondary) }
                    if entry.source == "TEMPORARY_BGG" || entry.source == "DETACHED_COLLECTION" {
                        Text("Nur in dieser Reihe").font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Spacer(minLength: 0)
                Menu {
                    Button("Aus Reihe entfernen", role: .destructive) { confirmingDelete = true }
                } label: {
                    Image(systemName: "ellipsis").frame(width: 44, height: 44)
                }.accessibilityLabel("Aktionen für \(game?.name ?? entry.gameName ?? "Spiel")")
            }
            ViewThatFits(in: .horizontal) {
                HStack { rating; Spacer(minLength: 0); played }
                VStack(alignment: .leading) { rating; played }
            }
            if entry.source == "TEMPORARY_BGG" || entry.source == "DETACHED_COLLECTION" {
                Button("In Sammlung übernehmen") { Task { await collect() } }
                    .frame(minHeight: 44).disabled(collecting)
            }
            if let collectionError { Text(collectionError).font(.subheadline).foregroundStyle(.red) }
        }
        .padding()
        .background(ClubTheme.surface, in: .rect(cornerRadius: 14))
        .tint(ClubTheme.tint)
        .alert("Spiel aus Reihe entfernen?", isPresented: $confirmingDelete) {
            Button("Abbrechen", role: .cancel) { }
            Button("Entfernen", role: .destructive) { onDelete() }
        } message: { Text("Der Reihenfortschritt dieses Spiels wird entfernt. Ein Sammlungsspiel bleibt in deiner Sammlung.") }
    }

    private var rating: some View {
        HStack(spacing: 0) {
            ForEach(1...5, id: \.self) { index in
                Button { onRate(index) } label: {
                    Image(systemName: index <= (entry.rating ?? 0) ? "star.fill" : "star")
                        .foregroundStyle(ClubTheme.tint)
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(index) \(index == 1 ? "Stern" : "Sterne") vergeben")
            }
        }
    }

    private var played: some View {
        Button(action: onTogglePlayed) {
            Image(systemName: entry.played ? "checkmark.circle.fill" : "circle")
                .font(.title2).frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(entry.played ? "Als ungespielt markieren" : "Als gespielt markieren")
        .accessibilityValue(entry.played ? "Gespielt" : "Ungespielt")
    }

    private func collect() async {
        guard !collecting else { return }
        collecting = true
        defer { collecting = false }
        do {
            try await RemoteDataSource.shared.collectSeriesEntry(seriesID: entry.seriesId, entryID: entry.id)
            await syncEngine.sync()
            collectionError = syncEngine.errorMessage
        } catch { collectionError = NativeRules.errorMessage(error) }
    }
}
