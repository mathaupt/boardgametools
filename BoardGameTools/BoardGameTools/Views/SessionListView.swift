import SwiftUI

struct SessionListView: View {
    @State private var sessions: [SessionDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(sessions) { session in
                SessionRow(session: session)
            }
            .navigationTitle("Sessions")
            .task { await load() }
            .refreshable { await load() }
            .overlay {
                if isLoading { ProgressView() }
                else if let errorMessage = errorMessage { Text(errorMessage).foregroundStyle(.red) }
                else if sessions.isEmpty { Text("Noch keine Sessions") }
            }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            sessions = try await APIClient.shared.request(method: .get, endpoint: .sessions)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct SessionRow: View {
    let session: SessionDTO

    var body: some View {
        VStack(alignment: .leading) {
            Text(session.playedAt.formattedISO8601() ?? session.playedAt)
                .font(.headline)
            Text("\(session.players.count) Spieler")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
