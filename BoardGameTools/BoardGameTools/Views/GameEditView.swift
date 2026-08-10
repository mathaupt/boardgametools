import SwiftUI
import SwiftData

struct GameEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine
    let existingGame: GameDTO?

    @State private var name = ""
    @State private var description = ""
    @State private var minPlayers = ""
    @State private var maxPlayers = ""
    @State private var playTimeMinutes = ""
    @State private var complexity = 0
    @State private var tagNames = ""
    @State private var imageUrl = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var isValid: Bool {
        !name.isEmpty && !minPlayers.isEmpty && !maxPlayers.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Titel & Beschreibung") {
                    TextField("Name", text: $name)
                    TextField("Beschreibung", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Spieldetails") {
                    HStack {
                        Text("Spieler")
                        Spacer()
                        TextField("Min", text: $minPlayers)
                            .keyboardType(.numberPad)
                            .frame(width: 60)
                        Text("–")
                        TextField("Max", text: $maxPlayers)
                            .keyboardType(.numberPad)
                            .frame(width: 60)
                    }

                    HStack {
                        Text("Spieldauer (min)")
                        Spacer()
                        TextField("Optional", text: $playTimeMinutes)
                            .keyboardType(.numberPad)
                            .frame(width: 80)
                    }

                    Picker("Komplexität", selection: $complexity) {
                        Text("Keine").tag(0)
                        ForEach(1...5, id: \.self) { value in
                            Text(String(repeating: "★", count: value)).tag(value)
                        }
                    }
                }

                Section("Tags & Bild") {
                    TextField("Tags (kommasepariert)", text: $tagNames)
                    TextField("Bild-URL", text: $imageUrl)
                        .autocapitalization(.none)
                        .keyboardType(.URL)
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(existingGame == nil ? "Spiel hinzufügen" : "Spiel bearbeiten")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                }
            }
            .task {
                if let game = existingGame {
                    name = game.name
                    description = game.description ?? ""
                    minPlayers = String(game.minPlayers)
                    maxPlayers = String(game.maxPlayers)
                    playTimeMinutes = game.playTimeMinutes.map(String.init) ?? ""
                    complexity = game.complexity ?? 0
                    tagNames = game.tagNames?.joined(separator: ", ") ?? ""
                    imageUrl = game.imageUrl ?? ""
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            let input = GameInput(
                name: name,
                description: description.isEmpty ? nil : description,
                minPlayers: Int(minPlayers),
                maxPlayers: Int(maxPlayers),
                playTimeMinutes: Int(playTimeMinutes),
                complexity: complexity == 0 ? nil : complexity,
                bggId: existingGame?.bggId,
                ean: existingGame?.ean,
                imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                tagNames: tagNames.isEmpty ? nil : tagNames.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            )

            if let existingGame = existingGame {
                _ = try await RemoteDataSource.shared.updateGame(id: existingGame.id, input)
            } else {
                _ = try await RemoteDataSource.shared.createGame(input)
            }

            await syncEngine.sync()
            dismiss()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
