import Foundation
import SwiftData

@Model
final class LocalSession {
    @Attribute(.unique) var id: String
    var gameId: String
    var playedAt: String
    var durationMinutes: Int?
    var notes: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var syncState: String

    @Relationship(deleteRule: .cascade)
    var players: [LocalSessionPlayer]?

    init(dto: SessionDTO) {
        self.id = dto.id
        self.gameId = dto.gameId
        self.playedAt = dto.playedAt
        self.durationMinutes = dto.durationMinutes
        self.notes = dto.notes
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
        self.deletedAt = dto.deletedAt
        self.players = dto.players.map { LocalSessionPlayer(dto: $0) }
        self.syncState = SyncState.synced.rawValue
    }

    func update(from dto: SessionDTO) {
        gameId = dto.gameId
        playedAt = dto.playedAt
        durationMinutes = dto.durationMinutes
        notes = dto.notes
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
        players = dto.players.map { LocalSessionPlayer(dto: $0) }
    }
}

@Model
final class LocalSessionPlayer {
    var id: String?
    var userId: String
    var score: Int?
    var isWinner: Bool
    var placement: Int?

    init(dto: SessionPlayerDTO) {
        self.id = dto.id
        self.userId = dto.userId
        self.score = dto.score
        self.isWinner = dto.isWinner
        self.placement = dto.placement
    }
}
