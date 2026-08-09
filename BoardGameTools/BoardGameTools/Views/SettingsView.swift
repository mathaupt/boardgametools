import SwiftUI

struct SettingsView: View {
    @Environment(AuthManager.self) private var authManager
    @State private var apiURL: String = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("API-URL") {
                    TextField("https://...", text: $apiURL)
                        .autocapitalization(.none)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                    Button("Speichern") {
                        if let url = URL(string: apiURL), !apiURL.isEmpty {
                            APIClient.shared.baseURL = url
                        }
                    }
                }

                Section {
                    Button(role: .destructive) {
                        Task { await logout() }
                    } label: {
                        Text("Abmelden")
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
            .onAppear {
                apiURL = APIClient.shared.baseURL.absoluteString
            }
        }
    }

    private func logout() async {
        do {
            try await authManager.logout()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
