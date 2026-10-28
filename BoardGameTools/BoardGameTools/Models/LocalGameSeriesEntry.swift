import Foundation
import SwiftData

@Model
final class LocalGameSeriesEntry {
    @Attribute(.unique) var id: String
    var seriesId: String
    var gameId: String
    var sortOrder: Int
    var played: Bool
    var playedAt: String?
    var rating: Int?
    var difficulty: String?
    var playTimeMinutes: Int?
    var successful: Bool?
    var playerCount: Int?
    var score: Int?
    var createdAt: String
    var updatedAt: String

    var series: LocalGameSeries?
    @Relationship(deleteRule: .nullify)
    var game: LocalGame?

    init(dto: SeriesEntryDTO) {
        self.id = dto.id
        self.seriesId = dto.seriesId
        self.gameId = dto.gameId
        self.sortOrder = dto.sortOrder
        self.played = dto.played
        self.playedAt = dto.playedAt
        self.rating = dto.rating
        self.difficulty = dto.difficulty
        self.playTimeMinutes = dto.playTimeMinutes
        self.successful = dto.successful
        self.playerCount = dto.playerCount
        self.score = dto.score
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
    }

    func update(from dto: SeriesEntryDTO) {
        seriesId = dto.seriesId
        gameId = dto.gameId
        sortOrder = dto.sortOrder
        played = dto.played
        playedAt = dto.playedAt
        rating = dto.rating
        difficulty = dto.difficulty
        playTimeMinutes = dto.playTimeMinutes
        successful = dto.successful
        playerCount = dto.playerCount
        score = dto.score
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
    }

    func toDTO() -> SeriesEntryDTO {
        SeriesEntryDTO(
            id: id,
            seriesId: seriesId,
            gameId: gameId,
            sortOrder: sortOrder,
            played: played,
            playedAt: playedAt,
            rating: rating,
            difficulty: difficulty,
            playTimeMinutes: playTimeMinutes,
            successful: successful,
            playerCount: playerCount,
            score: score,
            createdAt: createdAt,
            updatedAt: updatedAt,
            game: game.map { SeriesGameSummary(imageUrl: $0.imageUrl) }
        )
    }
}
