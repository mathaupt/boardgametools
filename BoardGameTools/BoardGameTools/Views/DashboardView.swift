import SwiftUI

struct DashboardView: View {
    @State private var dashboard: DashboardDTO?
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else if let dashboard = dashboard {
                    DashboardContent(dashboard: dashboard)
                } else if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                } else {
                    Text("Keine Daten verfügbar")
                }
            }
            .navigationTitle("Dashboard")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            dashboard = try await APIClient.shared.request(method: .get, endpoint: .dashboard)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct DashboardContent: View {
    let dashboard: DashboardDTO

    var body: some View {
        VStack(spacing: 16) {
            DashboardTile(title: "Spiele", value: dashboard.games, icon: "dice")
            DashboardTile(title: "Sessions", value: dashboard.sessions, icon: "calendar")
            DashboardTile(title: "Events", value: dashboard.events, icon: "person.3")
            DashboardTile(title: "Gruppen", value: dashboard.groups, icon: "person.2")
        }
        .padding()
    }
}

struct DashboardTile: View {
    let title: String
    let value: Int
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .frame(width: 44)
            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                Text("\(value)")
                    .font(.title)
                    .fontWeight(.bold)
            }
            Spacer()
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(.rect(cornerRadius: 12))
    }
}
