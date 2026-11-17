import Foundation

struct EventProposalDTO: Codable, Identifiable, Sendable {
    let id: String
    var eventId: String
    var gameId: String?
    var proposedById: String?
    var bggId: String?
    var bggName: String?
    var bggImageUrl: String?
    var bggMinPlayers: Int?
    var bggMaxPlayers: Int?
    var bggPlayTimeMinutes: Int?
    var voteCount: Int?
    var userHasVoted: Bool?
    var game: GameDTO?
    var createdAt: String
}

struct DateVoteDTO: Codable, Identifiable, Sendable {
    let id: String
    var dateProposalId: String
    var userId: String
    var availability: String
    var createdAt: String
}

struct DateProposalDTO: Codable, Identifiable, Sendable {
    let id: String
    var eventId: String
    var date: String
    var votes: [DateVoteDTO]?
    var createdAt: String
}

struct NativeEventState: Codable, Sendable {
    var label: String
    var available: [String: Bool]
    var blockedReason: String?
}

struct EventDTO: Codable, Identifiable, Sendable {
    let id: String
    var title: String
    var description: String?
    var eventDate: String
    var location: String?
    var status: String
    var groupId: String?
    var isCreator: Bool?
    var currentUserId: String?
    var eventState: NativeEventState?
    var selectedGame: GameDTO?
    var selectedGameId: String?
    var winningProposalId: String?
    var isPublic: Bool?
    var shareToken: String?
    var proposals: [EventProposalDTO]?
    var dateProposals: [DateProposalDTO]?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
}

