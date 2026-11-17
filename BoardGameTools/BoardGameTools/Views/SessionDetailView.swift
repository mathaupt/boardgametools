import SwiftUI
import SwiftData

struct SessionDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query private var games: [LocalGame]
    let session: SessionDTO

    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 16) {
                    GameCover(imageUrl: session.imageURL(in: games.map { $0.toDTO() }), name: session.gameName(in: games.map { $0.toDTO() }))
                        .frame(width: 56, height: 70)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.gameName(in: games.map { $0.toDTO() })).font(.headline)
                        Text(session.playedAt.formattedISO8601() ?? session.playedAt)
                            .font(.title2)
                            .fontWeight(.bold)
                        if let duration = session.durationMinutes {
                            DetailPill(icon: "clock", text: "\(duration) min")
                        }
                    }
                }

                if let notes = session.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                Text("Mitspieler")
                    .font(.headline)

                VStack(spacing: 10) {
                    ForEach(Array(session.players.enumerated()), id: \.offset) { _, player in
                        PlayerRow(player: player)
                    }
                }

                ForEach(session.guestPlayers ?? [], id: \.id) { guest in
                    VStack(alignment: .leading) {
                        Text(guest.name).font(.headline)
                        if let score = guest.score { Text("\(score) Punkte") }
                        if guest.isWinner { Label("Gewonnen", systemImage: "trophy") }
                    }
                }
                if !session.canEditInNativeForm {
                    Text("Diese Eventpartie kannst du hier ansehen. Zum Bearbeiten öffne sie in der Web-App.")
                        .foregroundStyle(.secondary)
                }
                HStack(spacing: 12) {
                    if session.canEditInNativeForm {
                    Button("Bearbeiten") {
                        isEditing = true
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(ClubTheme.tint)
                    }

                    Button("Löschen") {
                        isDeleting = true
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                }

                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .padding()
        }
        .background(ClubTheme.background.ignoresSafeArea())
        .navigationTitle("Session")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isEditing) {
            SessionEditView(existingSession: session)
        }
        .alert("Session löschen?", isPresented: $isDeleting) {
            Button("Abbrechen", role: .cancel) {}
            Button("Löschen", role: .destructive) {
                Task { await deleteSession() }
            }
        } message: {
            Text("Diese Session wird unwiderruflich entfernt.")
        }
    }

    private func deleteSession() async {
        do {
            try await RemoteDataSource.shared.deleteSession(id: session.id)
            await syncEngine.sync()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PlayerRow: View {
    let player: SessionPlayerDTO

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(player.userId)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                if let score = player.score {
                    Text("\(score) Punkte")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if let placement = player.placement {
                    Text("Platz \(placement)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if player.isWinner {
                Image(systemName: "crown.fill")
                    .foregroundStyle(Theme.secondary)
            }
        }
        .padding()
        .background(ClubTheme.surface)
        .clipShape(.rect(cornerRadius: 12))
    }
}
