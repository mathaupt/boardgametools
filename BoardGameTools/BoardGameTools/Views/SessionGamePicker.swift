import SwiftUI
import SwiftData

struct SessionGamePicker: View {
    @Environment(\.dismiss) private var dismiss
    let games: [GameDTO]
    let onSelect: (String) -> Void
    @State private var query = ""

    private var results: [GameDTO] { NativeRules.matchingGames(games, query: query) }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Spiel suchen", text: $query)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityLabel("Spiel suchen")
                        .frame(minHeight: 44)
                }
                if results.isEmpty {
                    ContentUnavailableView(games.isEmpty ? "Noch keine Spiele" : "Keine Spiele gefunden", systemImage: "magnifyingglass", description: Text(games.isEmpty ? "Füge zuerst ein Spiel zu deiner Sammlung hinzu." : "Versuche einen anderen Suchbegriff."))
                }
                ForEach(results) { game in
                    Button {
                        onSelect(game.id)
                        dismiss()
                    } label: {
                        HStack(spacing: 12) {
                            GameCover(imageUrl: game.imageUrl, name: game.name)
                                .frame(width: 44, height: 56)
                            VStack(alignment: .leading) {
                                Text(game.name).foregroundStyle(ClubTheme.ink)
                                Text("\(game.minPlayers)–\(game.maxPlayers) Spieler")
                                    .font(.subheadline).foregroundStyle(ClubTheme.secondaryInk)
                            }
                            Spacer(minLength: 0)
                        }
                        .frame(minHeight: 44)
                        .contentShape(.rect)
                    }
                    .accessibilityLabel("\(game.name) auswählen")
                }
            }
            .navigationTitle("Spiel auswählen")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } } }
        }
        .tint(ClubTheme.tint)
    }
}
