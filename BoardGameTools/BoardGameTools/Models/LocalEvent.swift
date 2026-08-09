import Foundation
import SwiftData

@Model
final class LocalEvent {
    @Attribute(.unique) var id: String
    var title: String
    var desc: String?
    var eventDate: String
    var location: String?
    var status: String
    var groupId: String?
    var selectedGameId: String?
    var winningProposalId: String?
    var isPublic: Bool
    var shareToken: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var syncState: String

    @Relationship(deleteRule: .cascade)
    var proposals: [LocalEventProposal]?

    @Relationship(deleteRule: .cascade)
    var dateProposals: [LocalDateProposal]?

    init(dto: EventDTO) {
        self.id = dto.id
        self.title = dto.title
        self.desc = dto.description
        self.eventDate = dto.eventDate
        self.location = dto.location
        self.status = dto.status
        self.groupId = dto.groupId
        self.selectedGameId = dto.selectedGameId
        self.winningProposalId = dto.winningProposalId
        self.isPublic = dto.isPublic ?? false
        self.shareToken = dto.shareToken
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
        self.deletedAt = dto.deletedAt
        self.proposals = dto.proposals?.map { LocalEventProposal(dto: $0) }
        self.dateProposals = dto.dateProposals?.map { LocalDateProposal(dto: $0) }
        self.syncState = SyncState.synced.rawValue
    }

    func update(from dto: EventDTO) {
        title = dto.title
        desc = dto.description
        eventDate = dto.eventDate
        location = dto.location
        status = dto.status
        groupId = dto.groupId
        selectedGameId = dto.selectedGameId
        winningProposalId = dto.winningProposalId
        isPublic = dto.isPublic ?? false
        shareToken = dto.shareToken
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
        proposals = dto.proposals?.map { LocalEventProposal(dto: $0) }
        dateProposals = dto.dateProposals?.map { LocalDateProposal(dto: $0) }
    }
}

@Model
final class LocalEventProposal {
    @Attribute(.unique) var id: String
    var eventId: String
    var gameId: String?
    var proposedById: String?
    var bggId: String?
    var bggName: String?
    var bggImageUrl: String?
    var bggMinPlayers: Int?
    var bggMaxPlayers: Int?
    var bggPlayTimeMinutes: Int?
    var voteCount: Int
    var createdAt: String

    init(dto: EventProposalDTO) {
        self.id = dto.id
        self.eventId = dto.eventId
        self.gameId = dto.gameId
        self.proposedById = dto.proposedById
        self.bggId = dto.bggId
        self.bggName = dto.bggName
        self.bggImageUrl = dto.bggImageUrl
        self.bggMinPlayers = dto.bggMinPlayers
        self.bggMaxPlayers = dto.bggMaxPlayers
        self.bggPlayTimeMinutes = dto.bggPlayTimeMinutes
        self.voteCount = dto.voteCount ?? 0
        self.createdAt = dto.createdAt
    }

    func update(from dto: EventProposalDTO) {
        eventId = dto.eventId
        gameId = dto.gameId
        proposedById = dto.proposedById
        bggId = dto.bggId
        bggName = dto.bggName
        bggImageUrl = dto.bggImageUrl
        bggMinPlayers = dto.bggMinPlayers
        bggMaxPlayers = dto.bggMaxPlayers
        bggPlayTimeMinutes = dto.bggPlayTimeMinutes
        voteCount = dto.voteCount ?? 0
        createdAt = dto.createdAt
    }
}

@Model
final class LocalDateProposal {
    @Attribute(.unique) var id: String
    var eventId: String
    var date: String
    var createdAt: String

    @Relationship(deleteRule: .cascade)
    var votes: [LocalDateVote]?

    init(dto: DateProposalDTO) {
        self.id = dto.id
        self.eventId = dto.eventId
        self.date = dto.date
        self.createdAt = dto.createdAt
        self.votes = dto.votes?.map { LocalDateVote(dto: $0) }
    }
}

@Model
final class LocalDateVote {
    @Attribute(.unique) var id: String
    var dateProposalId: String
    var userId: String
    var availability: String
    var createdAt: String

    init(dto: DateVoteDTO) {
        self.id = dto.id
        self.dateProposalId = dto.dateProposalId
        self.userId = dto.userId
        self.availability = dto.availability
        self.createdAt = dto.createdAt
    }
}

@Model
final class LocalVote {
    @Attribute(.unique) var id: String
    var proposalId: String
    var userId: String
    var createdAt: String

    init(dto: VoteDTO) {
        self.id = dto.id
        self.proposalId = dto.proposalId
        self.userId = dto.userId
        self.createdAt = dto.createdAt
    }
}
