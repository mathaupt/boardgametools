import SwiftUI
import SwiftData

private struct EditablePlayer: Identifiable {
    var id: String
    var userId: String
    var score: String
    var placement: String
    var isWinner: Bool
}

struct SessionEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var authManager
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]

    let existingSession: SessionDTO?

    @State private var selectedGameId: String = ""
    @State private var playedAt = Date()
    @State private var durationMinutes = ""
    @State private var notes = ""
    @State private var players: [EditablePlayer] = []
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showNewPlayerField = false
    @State private var newPlayerUserId = ""

    private var isValid: Bool {
        !selectedGameId.isEmpty && !players.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Spiel") {
                    Picker("Spiel", selection: $selectedGameId) {
                        Text("Bitte wählen").tag("")
                        ForEach(localGames) { game in
                            Text(game.name).tag(game.id)
                        }
                    }
                }

                Section("Zeit & Dauer") {
                    DatePicker("Gespielt am", selection: $playedAt)
                    TextField("Dauer in Minuten", text: $durationMinutes)
                        .keyboardType(.numberPad)
                }

                Section("Notizen") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                Section("Mitspieler") {
                    ForEach($players) { $player in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(player.userId)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Toggle("Gewinner", isOn: $player.isWinner)
                                    .toggleStyle(.switch)
                                    .labelsHidden()
                            }
                            HStack {
                                TextField("Punkte", text: $player.score)
                                    .keyboardType(.numberPad)
                                TextField("Platz", text: $player.placement)
                                    .keyboardType(.numberPad)
                            }
                        }
                    }
                    .onDelete(perform: deletePlayer)

                    HStack {
                        TextField("User-ID", text: $newPlayerUserId)
                            .autocapitalization(.none)
                        Button("Hinzufügen") {
                            addPlayer()
                        }
                        .disabled(newPlayerUserId.isEmpty)
                    }
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(existingSession == nil ? "Session erstellen" : "Session bearbeiten")
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
                if let session = existingSession {
                    selectedGameId = session.gameId
                    playedAt = session.playedAt.iso8601Date() ?? Date()
                    durationMinutes = session.durationMinutes.map(String.init) ?? ""
                    notes = session.notes ?? ""
                    players = session.players.map { player in
                        EditablePlayer(
                            id: player.id ?? UUID().uuidString,
                            userId: player.userId,
                            score: player.score.map(String.init) ?? "",
                            placement: player.placement.map(String.init) ?? "",
                            isWinner: player.isWinner
                        )
                    }
                } else if let currentUser = authManager.currentUser {
                    players = [EditablePlayer(
                        id: UUID().uuidString,
                        userId: currentUser.id,
                        score: "",
                        placement: "",
                        isWinner: false
                    )]
                }
            }
        }
    }

    private func addPlayer() {
        guard !newPlayerUserId.isEmpty else { return }
        players.append(EditablePlayer(
            id: UUID().uuidString,
            userId: newPlayerUserId,
            score: "",
            placement: "",
            isWinner: false
        ))
        newPlayerUserId = ""
    }

    private func deletePlayer(at offsets: IndexSet) {
        players.remove(atOffsets: offsets)
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            let input = SessionInput(
                gameId: selectedGameId,
                playedAt: playedAt.iso8601String(),
                durationMinutes: Int(durationMinutes),
                notes: notes.isEmpty ? nil : notes,
                players: players.map { player in
                    SessionPlayerInput(
                        userId: player.userId,
                        score: Int(player.score),
                        isWinner: player.isWinner,
                        placement: Int(player.placement)
                    )
                }
            )

            if let existingSession = existingSession {
                _ = try await RemoteDataSource.shared.updateSession(id: existingSession.id, input)
            } else {
                _ = try await RemoteDataSource.shared.createSession(input)
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
