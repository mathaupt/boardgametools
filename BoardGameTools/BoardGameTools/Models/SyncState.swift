enum SyncState: String, Sendable {
    case synced
    case pendingCreate
    case pendingUpdate
    case pendingDelete
}
