import SwiftUI

struct EventListView: View {
    @State private var events: [EventDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(events) { event in
                EventRow(event: event)
            }
            .navigationTitle("Events")
            .task { await load() }
            .refreshable { await load() }
            .overlay {
                if isLoading { ProgressView() }
                else if let errorMessage = errorMessage { Text(errorMessage).foregroundStyle(.red) }
                else if events.isEmpty { Text("Noch keine Events") }
            }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            events = try await APIClient.shared.request(method: .get, endpoint: .events)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
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
