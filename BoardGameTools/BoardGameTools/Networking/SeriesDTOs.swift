import Foundation

struct SeriesGameSummary: Codable, Sendable {
    var imageUrl: String?
}

struct SeriesEntryDTO: Codable, Identifiable, Sendable {
    let id: String
    var seriesId: String
    var gameId: String
    var collectionGameId: String?
    var gameName: String?
    var gameDescription: String?
    var gameImageUrl: String?
    var minPlayers: Int?
    var maxPlayers: Int?
    var gamePlayTimeMinutes: Int?
    var complexity: Int?
    var bggId: String?
    var source: String?
    var temporaryReason: String?

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
    var game: SeriesGameSummary?
}

struct SeriesDTO: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var description: String?
    var imageUrl: String?
    var ownerId: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var entries: [SeriesEntryDTO]
}

struct SeriesInput: Encodable, Sendable {
    let name: String
    let description: String?
    let imageUrl: String?
}

struct SeriesEntryInput: Encodable, Sendable {
    let gameId: String
    let sortOrder: Int?
}

struct SeriesEntryUpdateInput: Encodable, Sendable {
    let played: Bool?
    let playedAt: String?
    let rating: Int?
    let difficulty: String?
    let playTimeMinutes: Int?
    let successful: Bool?
    let playerCount: Int?
    let score: Int?
}

struct SeriesReorderEntry: Encodable, Sendable {
    let id: String
    let sortOrder: Int
}

struct SeriesReorderInput: Encodable, Sendable {
    let entries: [SeriesReorderEntry]
}

