import Foundation
import SwiftData

@Model
final class LocalGameSeries {
    @Attribute(.unique) var id: String
    var name: String
    var desc: String?
    var imageUrl: String?
    var ownerId: String?
    var createdAt: String
    var updatedAt: String
    var deletedAt: String?
    var syncState: String
    var lastSyncedAt: String?

    @Relationship(deleteRule: .cascade, inverse: \LocalGameSeriesEntry.series)
    var entries: [LocalGameSeriesEntry]?

    init(dto: SeriesDTO) {
        self.id = dto.id
        self.name = dto.name
        self.desc = dto.description
        self.imageUrl = dto.imageUrl
        self.ownerId = dto.ownerId
        self.createdAt = dto.createdAt
        self.updatedAt = dto.updatedAt
        self.deletedAt = dto.deletedAt
        self.syncState = SyncState.synced.rawValue
        self.lastSyncedAt = nil
        self.entries = []
    }

    func update(from dto: SeriesDTO) {
        name = dto.name
        desc = dto.description
        imageUrl = dto.imageUrl
        ownerId = dto.ownerId
        createdAt = dto.createdAt
        updatedAt = dto.updatedAt
        deletedAt = dto.deletedAt
    }

    func toDTO() -> SeriesDTO {
        SeriesDTO(
            id: id,
            name: name,
            description: desc,
            imageUrl: imageUrl,
            ownerId: ownerId,
            createdAt: createdAt,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            entries: entries?.sorted { $0.sortOrder < $1.sortOrder }.map { $0.toDTO() } ?? []
        )
    }
}
