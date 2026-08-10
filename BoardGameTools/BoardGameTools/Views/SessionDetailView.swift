import SwiftUI

struct SessionDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    let session: SessionDTO

    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 16) {
                    ZStack {
                        Theme.warmGradient
                            .overlay(
                                Image(systemName: "dice.gamedots")
                                    .font(.title2)
                                    .foregroundStyle(.white.opacity(0.8))
                            )
                    }
                    .frame(width: 64, height: 64)
                    .clipShape(.rect(cornerRadius: 16))

                    VStack(alignment: .leading, spacing: 4) {
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

                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .padding()
        }
        .background(Theme.background.ignoresSafeArea())
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
        .background(Theme.cardBackground)
        .clipShape(.rect(cornerRadius: 12))
    }
}
