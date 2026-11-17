import SwiftUI
import SwiftData

struct EventDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(\.dismiss) private var dismiss
    @Query private var games: [LocalGame]
    let event: EventDTO
    @State private var detail: EventDTO?
    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var isPickingGame = false
    @State private var busy = false
    @State private var needsReload = true
    @State private var errorMessage: String?
    private var current: EventDTO { detail ?? event }

    var body: some View {
        List {
            Section {
                Text(current.title).font(.title2.bold())
                Text(current.eventState?.label ?? "Status wird geladen …")
                    .foregroundStyle(ClubTheme.secondaryInk)
                Label(current.eventDate.formattedISO8601() ?? current.eventDate, systemImage: "calendar")
                if let location = current.location, !location.isEmpty {
                    Label(location, systemImage: "mappin.and.ellipse")
                }
                if let description = current.description, !description.isEmpty { Text(description) }
            }
            if let errorMessage {
                Section {
                    Text(errorMessage).foregroundStyle(.red).accessibilityAddTraits(.updatesFrequently)
                    Button("Erneut laden") { Task { await reload() } }.frame(minHeight: 44)
                }
            }
            if let detail {
                if let selected = detail.selectedGame {
                    Section("Bestätigtes Spiel") { Text(selected.name).font(.headline) }
                } else if let winnerID = detail.winningProposalId,
                          let winner = detail.proposals?.first(where: { $0.id == winnerID }) {
                    Section("Bestätigtes Ergebnis") { Text(winner.game?.name ?? winner.bggName ?? "Spielvorschlag") }
                }
                EventProposalListView(event: detail, disabled: busy || needsReload,
                    onVote: { proposal in
                        Task { await mutate { try await RemoteDataSource.shared.setVote(eventID: event.id, proposalID: proposal.id, voted: proposal.userHasVoted != true) } }
                    }, onDelete: { proposal in
                        Task { await mutate { try await RemoteDataSource.shared.removeProposal(eventID: event.id, proposalID: proposal.id) } }
                    })
                if detail.eventState?.available["proposeGame"] == true {
                    Section {
                        Button("Spiel aus Sammlung vorschlagen", systemImage: "plus") { isPickingGame = true }
                            .frame(minHeight: 44).disabled(busy || needsReload)
                    }
                }
                if detail.isCreator == true {
                    Section("Verwalten") {
                        Button("Bearbeiten", systemImage: "pencil") { isEditing = true }.frame(minHeight: 44)
                        Button("Spieleabend löschen", role: .destructive) { isDeleting = true }.frame(minHeight: 44)
                    }.disabled(busy || needsReload)
                }
            } else if busy { ProgressView("Spieleabend wird geladen …") }
        }
        .scrollContentBackground(.hidden)
        .background(ClubTheme.background)
        .tint(ClubTheme.tint)
        .navigationTitle("Spieleabend")
        .navigationBarTitleDisplayMode(.inline)
        .task { await reload() }
        .refreshable { await reload() }
        .sheet(isPresented: $isEditing, onDismiss: { Task { await reload() } }) {
            EventEditView(existingEvent: current)
        }
        .sheet(isPresented: $isPickingGame) {
            SessionGamePicker(games: games.map { $0.toDTO() }.filter { game in
                !(detail?.proposals ?? []).contains { $0.gameId == game.id }
            }) { gameID in
                Task { await mutate { try await RemoteDataSource.shared.proposeGame(eventID: event.id, gameID: gameID) } }
            }
        }
        .alert("Spieleabend löschen?", isPresented: $isDeleting) {
            Button("Abbrechen", role: .cancel) { }
            Button("Löschen", role: .destructive) {
                Task {
                    guard !busy else { return }
                    busy = true
                    do {
                        try await RemoteDataSource.shared.deleteEvent(id: event.id)
                        await syncEngine.sync()
                        dismiss()
                    } catch { errorMessage = message(error) }
                    busy = false
                }
            }
        } message: { Text("Der Spieleabend wird entfernt.") }
    }

    private func reload() async {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        do {
            detail = try await RemoteDataSource.shared.event(id: event.id)
            needsReload = false
            errorMessage = nil
        } catch { needsReload = true; errorMessage = message(error) }
    }

    private func mutate(_ action: () async throws -> Void) async {
        guard !busy, !needsReload else { return }
        busy = true
        defer { busy = false }
        do {
            try await action()
            needsReload = true
            detail = try await RemoteDataSource.shared.event(id: event.id)
            needsReload = false
            errorMessage = nil
            await syncEngine.sync()
        } catch {
            needsReload = true
            errorMessage = "\(message(error)) Lade den Spieleabend neu, um den aktuellen Stand zu prüfen."
        }
    }

    private func message(_ error: Error) -> String {
        NativeRules.errorMessage(error)
    }
}
