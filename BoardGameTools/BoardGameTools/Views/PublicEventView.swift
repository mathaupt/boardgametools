import SwiftUI

struct PublicEventView: View {
    let token: String

    @Environment(\.dismiss) private var dismiss
    @State private var event: PublicEventDTO?
    @State private var nickname = ""
    @State private var guestId: String?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let event = event {
                    HStack(spacing: 16) {
                        ZStack {
                            Theme.roseGradient
                                .overlay(
                                    Image(systemName: "calendar.badge.sparkles")
                                        .font(.title2)
                                        .foregroundStyle(.white.opacity(0.8))
                                )
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(.rect(cornerRadius: 16))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(event.title)
                                .font(.title2)
                                .fontWeight(.bold)
                            EventStatusBadge(status: event.status)
                        }
                    }

                    if let description = event.description, !description.isEmpty {
                        Text(description)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Label(event.eventDate.formattedISO8601() ?? event.eventDate, systemImage: "calendar")
                        if let location = event.location, !location.isEmpty {
                            Label(location, systemImage: "mappin.and.ellipse")
                        }
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                    if let selectedGame = event.selectedGame {
                        GameInfoRow(game: selectedGame, title: "Gewähltes Spiel")
                    }

                    if let winningProposal = event.winningProposal {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Gewinner-Vorschlag")
                                .font(.headline)
                            HStack {
                                Text(winningProposal.bggName ?? "Unbekannt")
                                    .font(.subheadline)
                                Spacer()
                            }
                        }
                        .padding()
                        .background(Theme.cardBackground)
                        .clipShape(.rect(cornerRadius: 12))
                    }

                    Text("Vorschläge")
                        .font(.headline)

                    if event.proposals.isEmpty {
                        Text("Noch keine Vorschläge")
                            .foregroundStyle(.secondary)
                    } else {
                        VStack(spacing: 12) {
                            ForEach(event.proposals) { proposal in
                                PublicProposalRow(
                                    proposal: proposal,
                                    canVote: guestId != nil,
                                    isVoted: proposal.userHasVoted
                                ) {
                                    Task { await vote(for: proposal) }
                                }
                            }
                        }
                    }

                    if guestId == nil {
                        VStack(spacing: 12) {
                            TextField("Dein Nickname", text: $nickname)
                                .textFieldStyle(.roundedBorder)
                            Button("Mitmachen") {
                                Task { await join() }
                            }
                            .themeGradientButton()
                            .disabled(nickname.isEmpty || isLoading)
                        }
                        .padding()
                        .background(Theme.cardBackground)
                        .clipShape(.rect(cornerRadius: 12))
                    } else {
                        Text("Du nimmst als Gast teil.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else if isLoading {
                    LoadingOverlay(message: "Lade Event...")
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else {
                    EmptyStateView(icon: "calendar.badge.sparkles", title: "Event", subtitle: "Öffentliches Event wird geladen...")
                }
            }
            .padding()
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Öffentliches Event")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Schließen") { dismiss() }
            }
        }
        .task {
            await loadEvent()
        }
    }

    private func loadEvent() async {
        isLoading = true
        errorMessage = nil
        do {
            event = try await RemoteDataSource.shared.fetchPublicEvent(token: token)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func join() async {
        guard !nickname.isEmpty else { return }
        isLoading = true
        errorMessage = nil
        do {
            let participant = try await RemoteDataSource.shared.joinPublicEvent(token: token, nickname: nickname)
            guestId = participant.id
            await loadEvent()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func vote(for proposal: PublicEventProposalDTO) async {
        guard let guestId = guestId else { return }
        isLoading = true
        do {
            _ = try await RemoteDataSource.shared.votePublicEvent(token: token, guestId: guestId, proposalId: proposal.id)
            await loadEvent()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct GameInfoRow: View {
    let game: PublicEventGameDTO
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            HStack(spacing: 16) {
                GameCover(imageUrl: game.imageUrl, name: game.name)
                VStack(alignment: .leading, spacing: 4) {
                    Text(game.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    HStack(spacing: 4) {
                        Image(systemName: "person.2")
                        Text("\(game.minPlayers ?? 0)–\(game.maxPlayers ?? 0)")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Spacer()
            }
        }
        .padding()
        .background(Theme.cardBackground)
        .clipShape(.rect(cornerRadius: 12))
    }
}

struct PublicProposalRow: View {
    let proposal: PublicEventProposalDTO
    let canVote: Bool
    let isVoted: Bool
    let onVote: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            GameCover(imageUrl: proposal.game.imageUrl, name: proposal.game.name)

            VStack(alignment: .leading, spacing: 4) {
                Text(proposal.game.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text("\(proposal.totalVotes) Stimmen")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if isVoted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Theme.success)
            } else if canVote {
                Button("Wählen") {
                    onVote()
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
            }
        }
        .padding()
        .background(Theme.cardBackground)
        .clipShape(.rect(cornerRadius: 12))
    }
}
