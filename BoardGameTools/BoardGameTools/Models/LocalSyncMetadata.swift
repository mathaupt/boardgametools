import Foundation
import SwiftData

@Model
final class LocalSyncMetadata {
    @Attribute(.unique) var key: String
    var lastSyncedAt: String?
    var lastSyncStatus: String?

    init(key: String) {
        self.key = key
    }
}
