import Foundation
import SwiftData

@Model
final class LocalGroup {
    @Attribute(.unique) var id: String
    var name: String
    var desc: String?
    var ownerId: String
    var isPublic: Bool
    var shareToken: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var syncState: String

    @Relationship(deleteRule: .cascade)
    var members: [LocalGroupMember]?

    @Relationship(deleteRule: .cascade)
    var polls: [LocalGroupPoll]?

    @Relationship(deleteRule: .cascade)
    var comments: [LocalGroupComment]?

    init(dto: GroupDTO) {
        self.id = dto.id
        self.name = dto.name
        self.desc = dto.description
        self.ownerId = dto.ownerId
        self.isPublic = dto.isPublic
        self.shareToken = dto.shareToken
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
        self.deletedAt = dto.deletedAt
        self.members = dto.members?.map { LocalGroupMember(dto: $0) }
        self.polls = dto.polls?.map { LocalGroupPoll(dto: $0) }
        self.comments = dto.comments?.map { LocalGroupComment(dto: $0) }
        self.syncState = SyncState.synced.rawValue
    }

    func update(from dto: GroupDTO) {
        name = dto.name
        desc = dto.description
        ownerId = dto.ownerId
        isPublic = dto.isPublic
        shareToken = dto.shareToken
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
        members = dto.members?.map { LocalGroupMember(dto: $0) }
        polls = dto.polls?.map { LocalGroupPoll(dto: $0) }
        comments = dto.comments?.map { LocalGroupComment(dto: $0) }
    }

    func toDTO() -> GroupDTO {
        GroupDTO(
            id: id,
            name: name,
            description: desc,
            ownerId: ownerId,
            isPublic: isPublic,
            shareToken: shareToken,
            members: members?.map { $0.toDTO() },
            events: nil,
            polls: polls?.map { $0.toDTO() },
            comments: comments?.map { $0.toDTO() },
            createdAt: createdAt,
            updatedAt: updatedAt,
            deletedAt: deletedAt
        )
    }
}

@Model
final class LocalGroupMember {
    @Attribute(.unique) var id: String
    var groupId: String
    var userId: String
    var role: String
    var joinedAt: String

    init(dto: GroupMemberDTO) {
        self.id = dto.id
        self.groupId = dto.groupId
        self.userId = dto.userId
        self.role = dto.role
        self.joinedAt = dto.joinedAt
    }

    func toDTO() -> GroupMemberDTO {
        GroupMemberDTO(
            id: id,
            groupId: groupId,
            userId: userId,
            role: role,
            joinedAt: joinedAt
        )
    }
}

@Model
final class LocalGroupPoll {
    @Attribute(.unique) var id: String
    var groupId: String
    var title: String
    var desc: String?
    var type: String
    var status: String
    var createdById: String
    var closedAt: String?
    var createdAt: String

    @Relationship(deleteRule: .cascade)
    var options: [LocalGroupPollOption]?

    init(dto: GroupPollDTO) {
        self.id = dto.id
        self.groupId = dto.groupId
        self.title = dto.title
        self.desc = dto.description
        self.type = dto.type
        self.status = dto.status
        self.createdById = dto.createdById
        self.closedAt = dto.closedAt
        self.createdAt = dto.createdAt
        self.options = dto.options?.map { LocalGroupPollOption(dto: $0) }
    }

    func toDTO() -> GroupPollDTO {
        GroupPollDTO(
            id: id,
            groupId: groupId,
            title: title,
            description: desc,
            type: type,
            status: status,
            createdById: createdById,
            closedAt: closedAt,
            options: options?.map { $0.toDTO() },
            createdAt: createdAt
        )
    }
}

@Model
final class LocalGroupPollOption {
    @Attribute(.unique) var id: String
    var pollId: String
    var text: String
    var sortOrder: Int

    @Relationship(deleteRule: .cascade)
    var votes: [LocalGroupPollVote]?

    init(dto: GroupPollOptionDTO) {
        self.id = dto.id
        self.pollId = dto.pollId
        self.text = dto.text
        self.sortOrder = dto.sortOrder
        self.votes = dto.votes?.map { LocalGroupPollVote(dto: $0) }
    }

    func toDTO() -> GroupPollOptionDTO {
        GroupPollOptionDTO(
            id: id,
            pollId: pollId,
            text: text,
            sortOrder: sortOrder,
            votes: votes?.map { $0.toDTO() }
        )
    }
}

@Model
final class LocalGroupPollVote {
    @Attribute(.unique) var id: String
    var optionId: String
    var voterName: String
    var userId: String?
    var createdAt: String

    init(dto: GroupPollVoteDTO) {
        self.id = dto.id
        self.optionId = dto.optionId
        self.voterName = dto.voterName
        self.userId = dto.userId
        self.createdAt = dto.createdAt
    }

    func toDTO() -> GroupPollVoteDTO {
        GroupPollVoteDTO(
            id: id,
            optionId: optionId,
            voterName: voterName,
            userId: userId,
            createdAt: createdAt
        )
    }
}

@Model
final class LocalGroupComment {
    @Attribute(.unique) var id: String
    var groupId: String
    var pollId: String?
    var authorName: String
    var userId: String?
    var content: String
    var createdAt: String

    init(dto: GroupCommentDTO) {
        self.id = dto.id
        self.groupId = dto.groupId
        self.pollId = dto.pollId
        self.authorName = dto.authorName
        self.userId = dto.userId
        self.content = dto.content
        self.createdAt = dto.createdAt
    }

    func toDTO() -> GroupCommentDTO {
        GroupCommentDTO(
            id: id,
            groupId: groupId,
            pollId: pollId,
            authorName: authorName,
            userId: userId,
            content: content,
            createdAt: createdAt
        )
    }
}
