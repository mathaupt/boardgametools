import SwiftUI

struct EventProposalListView: View {
    let event: EventDTO
    let disabled: Bool
    let onVote: (EventProposalDTO) -> Void
    let onDelete: (EventProposalDTO) -> Void
    @State private var order: ProposalOrder = .votes
    @State private var selected: EventProposalDTO?
    @State private var deleting: EventProposalDTO?

    var body: some View {
        Section("Spielvorschläge") {
            Picker("Sortieren nach", selection: $order) {
                ForEach(ProposalOrder.allCases) { Text($0.rawValue).tag($0) }
            }
            if (event.proposals ?? []).isEmpty {
                Text("Noch keine Spielvorschläge.").foregroundStyle(.secondary)
            }
            ForEach(NativeRules.sortedProposals(event.proposals ?? [], order: order)) { proposal in
                VStack(alignment: .leading, spacing: 8) {
                    Button { selected = proposal } label: {
                        HStack(alignment: .top, spacing: 12) {
                            GameCover(imageUrl: proposal.game?.imageUrl ?? proposal.bggImageUrl, name: proposal.game?.name ?? proposal.bggName ?? "Spielvorschlag")
                                .frame(width: 44, height: 56)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(proposal.game?.name ?? proposal.bggName ?? "Spielvorschlag")
                                    .font(.headline).foregroundStyle(ClubTheme.ink).multilineTextAlignment(.leading)
                                Text("\(NativeRules.votesLabel(proposal.voteCount ?? 0)) · Spieldetails")
                                    .font(.subheadline).foregroundStyle(ClubTheme.secondaryInk)
                            }
                            Spacer(minLength: 0)
                        }.frame(minHeight: 44).contentShape(.rect)
                    }.buttonStyle(.plain)
                    HStack {
                        if event.eventState?.available["voteGame"] == true {
                            Button(proposal.userHasVoted == true ? "Stimme zurücknehmen" : "Abstimmen") { onVote(proposal) }
                                .buttonStyle(.bordered).frame(minHeight: 44)
                                .accessibilityLabel("\(proposal.game?.name ?? proposal.bggName ?? "Spiel"): \(proposal.userHasVoted == true ? "Stimme zurücknehmen" : "Abstimmen")")
                        }
                        Spacer(minLength: 0)
                        if NativeRules.canDelete(proposal, in: event) {
                            Button("Löschen", role: .destructive) { deleting = proposal }.frame(minHeight: 44)
                        }
                    }.disabled(disabled)
                }.padding(.vertical, 4)
            }
        }
        .sheet(item: $selected) { proposal in ProposalDetailSheet(proposal: proposal) }
        .alert("Vorschlag löschen?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })) {
            Button("Abbrechen", role: .cancel) { deleting = nil }
            Button("Löschen", role: .destructive) {
                if let deleting { onDelete(deleting) }
                deleting = nil
            }
        } message: { Text("Der Vorschlag und seine Stimmen werden entfernt.") }
    }
}

struct ProposalDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let proposal: EventProposalDTO
    var body: some View {
        NavigationStack {
            List {
                GameCover(imageUrl: proposal.game?.imageUrl ?? proposal.bggImageUrl, name: proposal.game?.name ?? proposal.bggName ?? "Spiel")
                    .frame(maxWidth: .infinity).frame(height: 180)
                    .accessibilityHidden(true)
                Text(proposal.game?.name ?? proposal.bggName ?? "Spielvorschlag").font(.title2.bold())
                if let min = proposal.game?.minPlayers ?? proposal.bggMinPlayers,
                   let max = proposal.game?.maxPlayers ?? proposal.bggMaxPlayers { Text("\(min)–\(max) Spieler") }
                if let minutes = proposal.game?.playTimeMinutes ?? proposal.bggPlayTimeMinutes { Text("\(minutes) Minuten") }
                Text(NativeRules.votesLabel(proposal.voteCount ?? 0))
                if let description = proposal.game?.description, !description.isEmpty { Text(description) }
            }
            .navigationTitle("Spieldetails").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Schließen") { dismiss() } } }
        }.tint(ClubTheme.tint)
    }
}
