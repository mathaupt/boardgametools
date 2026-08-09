import Foundation
import SwiftData

@Model
final class LocalGame {
    @Attribute(.unique) var id: String
    var name: String
    var desc: String?
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
    var tagNames: [String]
    var syncState: String
    var lastSyncedAt: String?

    init(dto: GameDTO) {
        self.id = dto.id
        self.name = dto.name
        self.desc = dto.description
        self.minPlayers = dto.minPlayers
        self.maxPlayers = dto.maxPlayers
        self.playTimeMinutes = dto.playTimeMinutes
        self.complexity = dto.complexity
        self.bggId = dto.bggId
        self.ean = dto.ean
        self.imageUrl = dto.imageUrl
        self.ownerId = dto.ownerId
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
        self.deletedAt = dto.deletedAt
        self.tagNames = dto.tagNames ?? []
        self.syncState = SyncState.synced.rawValue
        self.lastSyncedAt = nil
    }

    func update(from dto: GameDTO) {
        name = dto.name
        desc = dto.description
        minPlayers = dto.minPlayers
        maxPlayers = dto.maxPlayers
        playTimeMinutes = dto.playTimeMinutes
        complexity = dto.complexity
        bggId = dto.bggId
        ean = dto.ean
        imageUrl = dto.imageUrl
        ownerId = dto.ownerId
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
        tagNames = dto.tagNames ?? []
    }
}
