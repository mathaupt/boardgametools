import SwiftUI

struct SettingsView: View {
    @Environment(AuthManager.self) private var authManager
    @Environment(NetworkMonitor.self) private var networkMonitor
    @State private var apiURL: String = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Verbindung") {
                    TextField("API-URL", text: $apiURL)
                        .autocapitalization(.none)
                        .textContentType(.URL)
                        .keyboardType(.URL)

                    Button("Speichern") {
                        Task { await saveURL() }
                    }
                    .tint(Theme.primary)

                    HStack {
                        Text("Status")
                        Spacer()
                        Label(
                            networkMonitor.isOnline ? "Online" : "Offline",
                            systemImage: networkMonitor.isOnline ? "wifi" : "wifi.slash"
                        )
                        .foregroundStyle(networkMonitor.isOnline ? Theme.success : Theme.warning)
                    }
                }

                Section {
                    Button(role: .destructive) {
                        Task { await logout() }
                    } label: {
                        Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Einstellungen")
            .background(Theme.background.ignoresSafeArea())
            .onAppear {
                apiURL = APIClient.shared.baseURL.absoluteString
            }
        }
    }

    private func logout() async {
        do {
            try await authManager.logout()
            errorMessage = nil
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func saveURL() async {
        guard let url = URL(string: apiURL), !apiURL.isEmpty else {
            errorMessage = "Ungültige API-URL"
            return
        }

        // Changing the backend usually invalidates the current session.
        // Clear local auth state first so the user can log in again.
        await logout()
        APIClient.shared.baseURL = url
        errorMessage = nil
    }
}
