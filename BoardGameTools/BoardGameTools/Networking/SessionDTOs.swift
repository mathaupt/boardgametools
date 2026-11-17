import Foundation

struct SessionPlayerDTO: Codable, Sendable {
    var id: String?
    var userId: String
    var score: Int?
    var isWinner: Bool
    var placement: Int?
}

struct SessionGuestPlayerDTO: Codable, Sendable {
    var id: String
    var name: String
    var score: Int?
    var isWinner: Bool
    var placement: Int?
}

struct SessionDTO: Codable, Identifiable, Sendable {
    let id: String
    var gameId: String?
    var gameNameSnapshot: String?
    var gameBggIdSnapshot: String?
    var gameImageUrlSnapshot: String?
    var gameMinPlayersSnapshot: Int?
    var gameMaxPlayersSnapshot: Int?
    var gamePlayTimeMinutesSnapshot: Int?
    var gameComplexitySnapshot: Int?
    var playedAt: String
    var durationMinutes: Int?
    var notes: String?
    var players: [SessionPlayerDTO]
    var guestPlayers: [SessionGuestPlayerDTO]?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
}

