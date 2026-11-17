import Foundation

enum ProposalOrder: String, CaseIterable, Identifiable {
    case votes = "Meiste Stimmen", name = "Name A–Z", newest = "Neueste Vorschläge"
    var id: String { rawValue }
}

enum NativeRules {
    static func votesLabel(_ count: Int) -> String { "\(count) \(count == 1 ? "Stimme" : "Stimmen")" }

    static func errorMessage(_ error: Error) -> String {
        (error as? APIError)?.message ?? "Die Anfrage ist fehlgeschlagen. Bitte prüfe die Verbindung und versuche es erneut."
    }

    static func matchingGames(_ games: [GameDTO], query: String) -> [GameDTO] {
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return games.filter { game in
            game.deletedAt == nil && (term.isEmpty || game.name.range(of: term, options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "de_DE")) != nil)
        }
    }

    static func sortedProposals(_ proposals: [EventProposalDTO], order: ProposalOrder) -> [EventProposalDTO] {
        proposals.sorted { left, right in
            if order == .votes, (left.voteCount ?? 0) != (right.voteCount ?? 0) { return (left.voteCount ?? 0) > (right.voteCount ?? 0) }
            if order == .name {
                let comparison = (left.game?.name ?? left.bggName ?? "").compare(right.game?.name ?? right.bggName ?? "", options: [.numeric, .caseInsensitive], locale: Locale(identifier: "de_DE"))
                if comparison != .orderedSame { return comparison == .orderedAscending }
            }
            let a = ClubContent.date(left.createdAt) ?? .distantPast
            let b = ClubContent.date(right.createdAt) ?? .distantPast
            if a != b { return order == .newest ? a > b : a < b }
            return left.id < right.id
        }
    }

    static func canDelete(_ proposal: EventProposalDTO, in event: EventDTO) -> Bool {
        guard event.eventState?.available["proposeGame"] == true, event.winningProposalId != proposal.id,
              let userID = event.currentUserId else { return false }
        return event.isCreator == true || proposal.proposedById == userID
    }
}

extension SessionDTO {
    var canEditInNativeForm: Bool { gameId != nil && (guestPlayers ?? []).isEmpty }
    func gameName(in games: [GameDTO]) -> String {
        games.first { $0.id == gameId }?.name ?? gameNameSnapshot ?? "Unbekanntes Spiel"
    }
    func imageURL(in games: [GameDTO]) -> String? {
        games.first { $0.id == gameId }?.imageUrl ?? gameImageUrlSnapshot
    }
}
