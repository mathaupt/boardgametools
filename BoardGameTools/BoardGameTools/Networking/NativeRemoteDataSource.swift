import Foundation

extension RemoteDataSource {
    func event(id: String) async throws -> EventDTO {
        try await APIClient.shared.request(method: .get, endpoint: .event(id))
    }

    func setVote(eventID: String, proposalID: String, voted: Bool) async throws {
        if voted {
            struct VoteInput: Encodable, Sendable { let proposalId: String }
            try await APIClient.shared.request(method: .post, endpoint: .eventVotes(eventID), body: VoteInput(proposalId: proposalID))
        } else {
            try await APIClient.shared.request(method: .delete, endpoint: .eventVote(eventID, proposalID))
        }
    }

    func removeProposal(eventID: String, proposalID: String) async throws {
        try await APIClient.shared.request(method: .delete, endpoint: .eventProposal(eventID, proposalID))
    }

    func proposeGame(eventID: String, gameID: String) async throws {
        struct Input: Encodable, Sendable { let gameId: String }
        try await APIClient.shared.request(method: .post, endpoint: .eventProposals(eventID), body: Input(gameId: gameID))
    }

    func series(id: String) async throws -> SeriesDTO {
        try await APIClient.shared.request(method: .get, endpoint: .serie(id))
    }
}

struct BGGVersionDTO: Decodable, Identifiable, Sendable {
    let versionId: String
    let name: String
    let languages: [String]
    let publishers: [String]
    let yearPublished: Int?
    let imageUrl: String?
    let thumbnailUrl: String?
    var id: String { versionId }
}
struct BGGCollectionMatch: Decodable, Sendable {
    let id: String
    let name: String
}
struct BGGPresenceDTO: Decodable, Sendable {
    let matches: [String: BGGCollectionMatch?]
}

extension RemoteDataSource {
    func bggPresence(ids: [String]) async throws -> [String: BGGCollectionMatch?] {
        struct Input: Encodable, Sendable { let bggIds: [String] }
        let response: BGGPresenceDTO = try await APIClient.shared.request(method: .post, endpoint: .bggPresence, body: Input(bggIds: ids))
        guard ids.allSatisfy({ response.matches.keys.contains($0) }) else { throw APIError.decodingError("Die Sammlungsprüfung war unvollständig.") }
        return response.matches
    }

    func bggVersions(id: String) async throws -> [BGGVersionDTO] {
        try await APIClient.shared.request(method: .get, endpoint: .bggVersions(id))
    }

    func addSeriesSelection(seriesID: String, input: NativeSeriesEntryInput) async throws {
        var input = input
        if input.kind != "temporary", let bggID = input.bggId {
            let matches = try await bggPresence(ids: [bggID])
            if let match = matches[bggID] ?? nil {
                input.gameId = match.id
                input.bggId = nil
            }
        }
        try await APIClient.shared.request(method: .post, endpoint: .seriesEntries(seriesID), body: input)
    }

    func collectSeriesEntry(seriesID: String, entryID: String) async throws {
        try await APIClient.shared.request(method: .post, endpoint: .seriesEntryCollection(seriesID, entryID))
    }
}
