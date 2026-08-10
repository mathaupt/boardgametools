import SwiftUI

struct SettingsView: View {
    @Environment(AuthManager.self) private var authManager
    @Environment(NetworkMonitor.self) private var networkMonitor
    @State private var apiURL: String = ""
    @State private var name: String = ""
    @State private var currentPassword: String = ""
    @State private var newPassword: String = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?

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

                Section("Account") {
                    TextField("Name", text: $name)
                        .textContentType(.name)

                    SecureField("Aktuelles Passwort", text: $currentPassword)
                        .textContentType(.password)

                    SecureField("Neues Passwort", text: $newPassword)
                        .textContentType(.newPassword)

                    Button("Account aktualisieren") {
                        Task { await updateProfile() }
                    }
                    .tint(Theme.primary)
                    .disabled(name.isEmpty && currentPassword.isEmpty && newPassword.isEmpty)
                }

                Section {
                    Button(role: .destructive) {
                        Task { await logout() }
                    } label: {
                        Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }

                if let successMessage = successMessage {
                    Section {
                        Text(successMessage)
                            .foregroundStyle(Theme.success)
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
                name = authManager.currentUser?.name ?? ""
            }
        }
    }

    private func logout() async {
        do {
            try await authManager.logout()
            errorMessage = nil
            successMessage = nil
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

        do {
            try APIClient.shared.updateBaseURL(url)
        } catch {
            errorMessage = error.message
            return
        }

        // Changing the backend usually invalidates the current session.
        // Clear local auth state first so the user can log in again.
        await logout()
        errorMessage = nil
        successMessage = nil
    }

    private func updateProfile() async {
        errorMessage = nil
        successMessage = nil

        let hasNameChange = !name.isEmpty && name != authManager.currentUser?.name
        let hasPasswordChange = !newPassword.isEmpty

        guard hasNameChange || hasPasswordChange else {
            errorMessage = "Keine Änderungen"
            return
        }

        if hasPasswordChange && currentPassword.isEmpty {
            errorMessage = "Aktuelles Passwort ist zum Ändern des Passworts erforderlich"
            return
        }

        do {
            let updated = try await authManager.updateProfile(
                name: hasNameChange ? name : nil,
                currentPassword: hasPasswordChange ? currentPassword : nil,
                newPassword: hasPasswordChange ? newPassword : nil
            )
            name = updated.name
            currentPassword = ""
            newPassword = ""
            errorMessage = nil
            successMessage = "Account aktualisiert"
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
