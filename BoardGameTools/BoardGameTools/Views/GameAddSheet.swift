import SwiftUI

struct GameAddSheet: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink(destination: GameEditView(existingGame: nil)) {
                    AddOptionRow(
                        icon: "square.and.pencil",
                        title: "Manuell eintragen",
                        subtitle: "Titel, Spieleranzahl, Dauer und Bild selbst eingeben",
                        gradient: Theme.primaryGradient
                    )
                }
                .listRowBackground(Theme.cardBackground)

                NavigationLink(destination: BGGSearchView()) {
                    AddOptionRow(
                        icon: "globe",
                        title: "Aus BGG importieren",
                        subtitle: "Spiel bei BoardGameGeek suchen und automatisch übernehmen",
                        gradient: Theme.coolGradient
                    )
                }
                .listRowBackground(Theme.cardBackground)
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Spiel hinzufügen")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct AddOptionRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let gradient: LinearGradient

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                gradient
                    .overlay(
                        Image(systemName: icon)
                            .font(.title2)
                            .foregroundStyle(.white)
                    )
            }
            .frame(width: 56, height: 56)
            .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}
