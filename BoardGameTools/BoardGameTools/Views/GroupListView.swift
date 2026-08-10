import SwiftUI
import SwiftData

struct GroupListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalGroup.name) private var localGroups: [LocalGroup]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(localGroups.map { $0.toDTO() }) { group in
                GroupRow(group: group)
            }
            .navigationTitle("Gruppen")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localGroups.isEmpty {
                    ProgressView()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                } else if localGroups.isEmpty {
                    Text("Noch keine Gruppen")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GroupRow: View {
    let group: GroupDTO

    var body: some View {
        VStack(alignment: .leading) {
            Text(group.name)
                .font(.headline)
            if let desc = group.description, !desc.isEmpty {
                Text(desc)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
    }
}
