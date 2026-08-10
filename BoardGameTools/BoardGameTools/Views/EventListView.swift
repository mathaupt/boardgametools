import SwiftUI
import SwiftData

struct EventListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalEvent.eventDate) private var localEvents: [LocalEvent]
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(localEvents.map { $0.toDTO() }) { event in
                EventRow(event: event)
            }
            .navigationTitle("Events")
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localEvents.isEmpty {
                    ProgressView()
                } else if let errorMessage = errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                } else if localEvents.isEmpty {
                    Text("Noch keine Events")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct EventRow: View {
    let event: EventDTO

    var body: some View {
        VStack(alignment: .leading) {
            Text(event.title)
                .font(.headline)
            Text(event.eventDate.formattedISO8601() ?? event.eventDate)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(event.status)
                .font(.caption2)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(.green.opacity(0.2))
                .clipShape(.capsule)
        }
    }
}
