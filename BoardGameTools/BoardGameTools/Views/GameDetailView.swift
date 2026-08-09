import SwiftUI

struct GameDetailView: View {
    let game: GameDTO

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text(game.name)
                    .font(.largeTitle)
                    .fontWeight(.bold)

                if let description = game.description, !description.isEmpty {
                    Text(description)
                }

                Label("\(game.minPlayers) - \(game.maxPlayers) Spieler", systemImage: "person.2")
                if let time = game.playTimeMinutes {
                    Label("\(time) Minuten", systemImage: "clock")
                }
                if let complexity = game.complexity {
                    Label("Komplexität: \(complexity)/5", systemImage: "star")
                }

                if let tagNames = game.tagNames, !tagNames.isEmpty {
                    FlowLayout(spacing: 8) {
                        ForEach(tagNames, id: \.self) { tag in
                            Text(tag)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.blue.opacity(0.1))
                                .clipShape(.capsule)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(game.name)
    }
}
