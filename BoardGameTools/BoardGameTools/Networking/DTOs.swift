import Foundation

struct TokenResponse: Decodable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: String
    let user: UserDTO
}

struct UserDTO: Codable, Identifiable, Sendable {
    let id: String
    let email: String
    let name: String
    let role: String
}

struct DashboardDTO: Decodable, Sendable {
    let games: Int
    let sessions: Int
    let events: Int
    let groups: Int
}

struct GameDTO: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var description: String?
    var minPlayers: Int
    var maxPlayers: Int
    var playTimeMinutes: Int?
    var complexity: Int?
    var bggId: String?
    var ean: String?
    var imageUrl: String?
    var ownerId: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var tagNames: [String]?
}

struct SessionPlayerDTO: Codable, Sendable {
    var id: String?
    var userId: String
    var score: Int?
    var isWinner: Bool
    var placement: Int?
}

struct SessionDTO: Codable, Identifiable, Sendable {
    let id: String
    var gameId: String
    var playedAt: String
    var durationMinutes: Int?
    var notes: String?
    var players: [SessionPlayerDTO]
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
}

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

struct EventDTO: Codable, Identifiable, Sendable {
    let id: String
    var title: String
    var description: String?
    var eventDate: String
    var location: String?
    var status: String
    var groupId: String?
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

struct GroupMemberDTO: Codable, Identifiable, Sendable {
    let id: String
    var groupId: String
    var userId: String
    var role: String
    var joinedAt: String
}

struct GroupPollVoteDTO: Codable, Identifiable, Sendable {
    let id: String
    var optionId: String
    var voterName: String
    var userId: String?
    var createdAt: String
}

struct GroupPollOptionDTO: Codable, Identifiable, Sendable {
    let id: String
    var pollId: String
    var text: String
    var sortOrder: Int
    var votes: [GroupPollVoteDTO]?
}

struct GroupPollDTO: Codable, Identifiable, Sendable {
    let id: String
    var groupId: String
    var title: String
    var description: String?
    var type: String
    var status: String
    var createdById: String
    var closedAt: String?
    var options: [GroupPollOptionDTO]?
    var createdAt: String
}

struct GroupCommentDTO: Codable, Identifiable, Sendable {
    let id: String
    var groupId: String
    var pollId: String?
    var authorName: String
    var userId: String?
    var content: String
    var createdAt: String
}

struct GroupDTO: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var description: String?
    var ownerId: String
    var isPublic: Bool
    var shareToken: String?
    var members: [GroupMemberDTO]?
    var events: [EventDTO]?
    var polls: [GroupPollDTO]?
    var comments: [GroupCommentDTO]?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
}

struct GameInput: Encodable, Sendable {
    let name: String
    let description: String?
    let minPlayers: Int?
    let maxPlayers: Int?
    let playTimeMinutes: Int?
    let complexity: Int?
    let bggId: String?
    let ean: String?
    let imageUrl: String?
    let tagNames: [String]?
}

struct BGGSearchResult: Codable, Identifiable, Sendable {
    let bggId: String
    let name: String
    let yearPublished: Int?

    var id: String { bggId }
}

struct BGGGameDetail: Codable, Sendable {
    let bggId: String
    let name: String
    let description: String?
    let minPlayers: Int?
    let maxPlayers: Int?
    let playTimeMinutes: Int?
    let complexity: Double?
    let imageUrl: String?
    let categories: [String]?
}

struct UploadResponse: Decodable, Sendable {
    let url: String
    let path: String
}

struct SyncChanges<T: Codable & Sendable>: Codable, Sendable {
    let created: [T]
    let updated: [T]
    let deleted: [String]
}

struct SyncPayload: Codable, Sendable {
    let syncedAt: String
    let games: SyncChanges<GameDTO>
    let sessions: SyncChanges<SessionDTO>
    let events: SyncChanges<EventDTO>
    let dateProposals: SyncChanges<DateProposalDTO>
    let groups: SyncChanges<GroupDTO>
    let groupPolls: SyncChanges<GroupPollDTO>
    let groupComments: SyncChanges<GroupCommentDTO>
    let eventProposals: SyncChanges<EventProposalDTO>
    let votes: SyncChanges<VoteDTO>
    let dateVotes: SyncChanges<DateVoteDTO>
    let groupPollVotes: SyncChanges<GroupPollVoteDTO>
    let groupMembers: SyncChanges<GroupMemberDTO>
}

struct VoteDTO: Codable, Identifiable, Sendable {
    let id: String
    var proposalId: String
    var userId: String
    var createdAt: String
}

struct GuestParticipantDTO: Codable, Identifiable, Sendable {
    let id: String
    var eventId: String
    var nickname: String
    var createdAt: String
}

struct PublicEventResponse: Decodable, Sendable {
    let event: EventDTO
    let guestId: String?
    let guestName: String?
}
