import SwiftUI

struct GroupListView: View {
    @State private var groups: [GroupDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(groups) { group in
                GroupRow(group: group)
            }
            .navigationTitle("Gruppen")
            .task { await load() }
            .refreshable { await load() }
            .overlay {
                if isLoading { ProgressView() }
                else if let errorMessage = errorMessage { Text(errorMessage).foregroundStyle(.red) }
                else if groups.isEmpty { Text("Noch keine Gruppen") }
            }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            groups = try await APIClient.shared.request(method: .get, endpoint: .groups)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
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
