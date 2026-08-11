import Foundation
import SwiftData

@MainActor
final class LocalDataSource {
    private let context: ModelContext

    init(context: ModelContext) {
        self.context = context
    }

    // MARK: - Games

    func upsertGame(_ dto: GameDTO) throws {
        let descriptor = FetchDescriptor<LocalGame>(predicate: #Predicate { $0.id == dto.id })
        if let existing = try context.fetch(descriptor).first {
            existing.update(from: dto)
        } else {
            context.insert(LocalGame(dto: dto))
        }
    }

    func deleteGame(id: String) throws {
        let descriptor = FetchDescriptor<LocalGame>(predicate: #Predicate { $0.id == id })
        if let entity = try context.fetch(descriptor).first {
            context.delete(entity)
        }
    }

    func fetchGames() throws -> [LocalGame] {
        try context.fetch(FetchDescriptor<LocalGame>(sortBy: [SortDescriptor(\.name)]))
    }

    // MARK: - Sessions

    func upsertSession(_ dto: SessionDTO) throws {
        let descriptor = FetchDescriptor<LocalSession>(predicate: #Predicate { $0.id == dto.id })
        if let existing = try context.fetch(descriptor).first {
            existing.update(from: dto)
        } else {
            context.insert(LocalSession(dto: dto))
        }
    }

    func deleteSession(id: String) throws {
        let descriptor = FetchDescriptor<LocalSession>(predicate: #Predicate { $0.id == id })
        if let entity = try context.fetch(descriptor).first {
            context.delete(entity)
        }
    }

    func fetchSessions() throws -> [LocalSession] {
        try context.fetch(FetchDescriptor<LocalSession>(sortBy: [SortDescriptor(\.playedAt, order: .reverse)]))
    }

    // MARK: - Events

    func upsertEvent(_ dto: EventDTO) throws {
        let descriptor = FetchDescriptor<LocalEvent>(predicate: #Predicate { $0.id == dto.id })
        if let existing = try context.fetch(descriptor).first {
            existing.update(from: dto)
        } else {
            context.insert(LocalEvent(dto: dto))
        }
    }

    func deleteEvent(id: String) throws {
        let descriptor = FetchDescriptor<LocalEvent>(predicate: #Predicate { $0.id == id })
        if let entity = try context.fetch(descriptor).first {
            context.delete(entity)
        }
    }

    func fetchEvents() throws -> [LocalEvent] {
        try context.fetch(FetchDescriptor<LocalEvent>(sortBy: [SortDescriptor(\.eventDate)]))
    }

    // MARK: - Groups

    func upsertGroup(_ dto: GroupDTO) throws {
        let descriptor = FetchDescriptor<LocalGroup>(predicate: #Predicate { $0.id == dto.id })
        if let existing = try context.fetch(descriptor).first {
            existing.update(from: dto)
        } else {
            context.insert(LocalGroup(dto: dto))
        }
    }

    func deleteGroup(id: String) throws {
        let descriptor = FetchDescriptor<LocalGroup>(predicate: #Predicate { $0.id == id })
        if let entity = try context.fetch(descriptor).first {
            context.delete(entity)
        }
    }

    func fetchGroups() throws -> [LocalGroup] {
        try context.fetch(FetchDescriptor<LocalGroup>(sortBy: [SortDescriptor(\.name)]))
    }

    // MARK: - Series

    func upsertSeries(_ dto: SeriesDTO) throws {
        let descriptor = FetchDescriptor<LocalGameSeries>(predicate: #Predicate { $0.id == dto.id })
        let existing = try context.fetch(descriptor).first
        let series: LocalGameSeries
        if let existing = existing {
            series = existing
            series.update(from: dto)
        } else {
            series = LocalGameSeries(dto: dto)
            context.insert(series)
        }

        var newEntryIDs = Set<String>()
        for entryDTO in dto.entries {
            newEntryIDs.insert(entryDTO.id)
            let entryDescriptor = FetchDescriptor<LocalGameSeriesEntry>(predicate: #Predicate { $0.id == entryDTO.id })
            if let existingEntry = try context.fetch(entryDescriptor).first {
                existingEntry.update(from: entryDTO)
                existingEntry.series = series
            } else {
                let entry = LocalGameSeriesEntry(dto: entryDTO)
                entry.series = series
                context.insert(entry)
            }
        }

        // Remove entries that are no longer present
        let existingEntries = series.entries ?? []
        for entry in existingEntries where !newEntryIDs.contains(entry.id) {
            context.delete(entry)
        }
    }

    func deleteSeries(id: String) throws {
        let descriptor = FetchDescriptor<LocalGameSeries>(predicate: #Predicate { $0.id == id })
        if let entity = try context.fetch(descriptor).first {
            context.delete(entity)
        }
    }

    func fetchSeries() throws -> [LocalGameSeries] {
        try context.fetch(FetchDescriptor<LocalGameSeries>(sortBy: [SortDescriptor(\.name)]))
    }

    func fetchSeriesEntries(seriesId: String) throws -> [LocalGameSeriesEntry] {
        let descriptor = FetchDescriptor<LocalGameSeriesEntry>(
            predicate: #Predicate { $0.seriesId == seriesId },
            sortBy: [SortDescriptor(\.sortOrder)]
        )
        return try context.fetch(descriptor)
    }

    // MARK: - Sync metadata

    func syncMetadata(for key: String) throws -> LocalSyncMetadata {
        let predicate = #Predicate<LocalSyncMetadata> { $0.key == key }
        let descriptor = FetchDescriptor<LocalSyncMetadata>(predicate: predicate)
        if let existing = try context.fetch(descriptor).first {
            return existing
        }
        let meta = LocalSyncMetadata(key: key)
        context.insert(meta)
        return meta
    }

    func setLastSynced(at date: String, status: String) throws {
        let meta = try syncMetadata(for: "default")
        meta.lastSyncedAt = date
        meta.lastSyncStatus = status
    }

    // MARK: - Save

    func save() throws {
        try context.save()
    }
}
