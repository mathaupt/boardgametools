import SwiftUI

struct LoginView: View {
    @Environment(AuthManager.self) private var authManager
    @State private var email = ""
    @State private var password = ""
    @State private var apiURL = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            ZStack {
                Theme.primaryGradient
                Image(systemName: "dice.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.white.opacity(0.9))
            }
            .frame(width: 120, height: 120)
            .clipShape(.rect(cornerRadius: 28))
            .shadow(color: Theme.primary.opacity(0.4), radius: 16, x: 0, y: 8)

            Text("BoardGameTools")
                .font(.largeTitle)
                .fontWeight(.bold)

            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("API-URL")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack {
                        TextField("https://...", text: $apiURL)
                            .autocapitalization(.none)
                            .textContentType(.URL)
                            .keyboardType(.URL)
                            .textFieldStyle(.roundedBorder)
                        Button("Speichern") {
                            if let url = URL(string: apiURL), !apiURL.isEmpty {
                                APIClient.shared.baseURL = url
                            }
                        }
                        .buttonStyle(.bordered)
                        .tint(Theme.primary)
                        .disabled(apiURL.isEmpty)
                    }
                }

                TextField("E-Mail", text: $email)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .textFieldStyle(.roundedBorder)

                SecureField("Passwort", text: $password)
                    .textContentType(.password)
                    .textFieldStyle(.roundedBorder)

                Button {
                    Task { await login() }
                } label: {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Anmelden")
                    }
                }
                .themeGradientButton()
                .disabled(email.isEmpty || password.isEmpty || isLoading)

                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.callout)
                }
            }

            Spacer()
        }
        .padding(32)
        .background(Theme.background.ignoresSafeArea())
        .onAppear {
            apiURL = APIClient.shared.baseURL.absoluteString
        }
    }

    private func login() async {
        isLoading = true
        errorMessage = nil
        do {
            try await authManager.login(email: email, password: password)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
