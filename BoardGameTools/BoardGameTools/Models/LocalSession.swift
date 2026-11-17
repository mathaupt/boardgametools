import Foundation
import SwiftData

@Model
final class LocalSession {
    @Attribute(.unique) var id: String
    var gameId: String?
    var gameNameSnapshot: String?
    var gameBggIdSnapshot: String?
    var gameImageUrlSnapshot: String?
    var gameMinPlayersSnapshot: Int?
    var gameMaxPlayersSnapshot: Int?
    var gamePlayTimeMinutesSnapshot: Int?
    var gameComplexitySnapshot: Int?
    var guestPlayersData: Data?
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
        self.gameNameSnapshot = dto.gameNameSnapshot
        self.gameBggIdSnapshot = dto.gameBggIdSnapshot
        self.gameImageUrlSnapshot = dto.gameImageUrlSnapshot
        self.gameMinPlayersSnapshot = dto.gameMinPlayersSnapshot
        self.gameMaxPlayersSnapshot = dto.gameMaxPlayersSnapshot
        self.gamePlayTimeMinutesSnapshot = dto.gamePlayTimeMinutesSnapshot
        self.gameComplexitySnapshot = dto.gameComplexitySnapshot
        self.guestPlayersData = try? JSONEncoder().encode(dto.guestPlayers ?? [])
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
        gameNameSnapshot = dto.gameNameSnapshot
        gameBggIdSnapshot = dto.gameBggIdSnapshot
        gameImageUrlSnapshot = dto.gameImageUrlSnapshot
        gameMinPlayersSnapshot = dto.gameMinPlayersSnapshot
        gameMaxPlayersSnapshot = dto.gameMaxPlayersSnapshot
        gamePlayTimeMinutesSnapshot = dto.gamePlayTimeMinutesSnapshot
        gameComplexitySnapshot = dto.gameComplexitySnapshot
        guestPlayersData = try? JSONEncoder().encode(dto.guestPlayers ?? [])
        playedAt = dto.playedAt
        durationMinutes = dto.durationMinutes
        notes = dto.notes
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
        players = dto.players.map { LocalSessionPlayer(dto: $0) }
    }

    var guestPlayers: [SessionGuestPlayerDTO] {
        guard let guestPlayersData else { return [] }
        return (try? JSONDecoder().decode([SessionGuestPlayerDTO].self, from: guestPlayersData)) ?? []
    }

    func toDTO() -> SessionDTO {
        SessionDTO(
            id: id,
            gameId: gameId,
            gameNameSnapshot: gameNameSnapshot,
            gameBggIdSnapshot: gameBggIdSnapshot,
            gameImageUrlSnapshot: gameImageUrlSnapshot,
            gameMinPlayersSnapshot: gameMinPlayersSnapshot,
            gameMaxPlayersSnapshot: gameMaxPlayersSnapshot,
            gamePlayTimeMinutesSnapshot: gamePlayTimeMinutesSnapshot,
            gameComplexitySnapshot: gameComplexitySnapshot,

            playedAt: playedAt,
            durationMinutes: durationMinutes,
            notes: notes,
            players: players?.map { $0.toDTO() } ?? [],
            guestPlayers: guestPlayers,
            createdAt: createdAt,
            updatedAt: updatedAt,
            deletedAt: deletedAt
        )
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

    func toDTO() -> SessionPlayerDTO {
        SessionPlayerDTO(
            id: id,
            userId: userId,
            score: score,
            isWinner: isWinner,
            placement: placement
        )
    }
}
