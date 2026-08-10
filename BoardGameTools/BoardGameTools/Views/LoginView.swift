import SwiftUI

struct LoginView: View {
    @Environment(AuthManager.self) private var authManager
    @State private var email = ""
    @State private var password = ""
    @State private var apiURL = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        VStack(spacing: 20) {
            Text("BoardGameTools")
                .font(.largeTitle)
                .fontWeight(.bold)

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
                    .disabled(apiURL.isEmpty)
                }
            }
            .padding(.bottom)

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
                } else {
                    Text("Anmelden")
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || password.isEmpty || isLoading)

            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .foregroundStyle(.red)
            }
        }
        .padding()
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
