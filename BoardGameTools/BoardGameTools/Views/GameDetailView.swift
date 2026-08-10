import SwiftUI

struct GameDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    let game: GameDTO

    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let imageUrl = game.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        default:
                            emptyHeader
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 220)
                    .clipShape(.rect(cornerRadius: 20))
                    .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
                } else {
                    emptyHeader
                        .frame(maxWidth: .infinity)
                        .frame(height: 220)
                        .clipShape(.rect(cornerRadius: 20))
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text(game.name)
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    HStack(spacing: 16) {
                        DetailPill(icon: "person.2", text: "\(game.minPlayers)–\(game.maxPlayers)")
                        if let time = game.playTimeMinutes {
                            DetailPill(icon: "clock", text: "\(time) min")
                        }
                        if let complexity = game.complexity {
                            DetailPill(icon: "star.fill", text: "\(complexity)/5")
                        }
                    }

                    if let description = game.description, !description.isEmpty {
                        Text(description)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    if let tagNames = game.tagNames, !tagNames.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(tagNames, id: \.self) { tag in
                                Text(tag)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Theme.primary.opacity(0.12))
                                    .foregroundStyle(Theme.primary)
                                    .clipShape(.capsule)
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        Button("Bearbeiten") {
                            isEditing = true
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Theme.primary)

                        Button("Löschen") {
                            isDeleting = true
                        }
                        .buttonStyle(.bordered)
                        .tint(.red)
                    }
                    .padding(.top, 8)

                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .padding()
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle(game.name)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isEditing) {
            GameEditView(existingGame: game)
        }
        .alert("Spiel löschen?", isPresented: $isDeleting) {
            Button("Abbrechen", role: .cancel) {}
            Button("Löschen", role: .destructive) {
                Task { await deleteGame() }
            }
        } message: {
            Text("Dieses Spiel wird unwiderruflich entfernt.")
        }
    }

    private var emptyHeader: some View {
        Theme.primaryGradient
            .overlay(
                VStack {
                    Image(systemName: "dice")
                        .font(.system(size: 48))
                    Text(game.name)
                        .font(.title2)
                        .fontWeight(.bold)
                }
                .foregroundStyle(.white.opacity(0.9))
            )
    }

    private func deleteGame() async {
        do {
            try await RemoteDataSource.shared.deleteGame(id: game.id)
            await syncEngine.sync()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct DetailPill: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(text)
        }
        .font(.caption)
        .fontWeight(.semibold)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.thinMaterial)
        .clipShape(.capsule)
    }
}
