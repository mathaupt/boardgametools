import Foundation
import AuthenticationServices

@Observable
@MainActor
final class AuthManager {
    static let shared = AuthManager()

    private(set) var isAuthenticated: Bool = false
    private(set) var currentUser: UserDTO?

    private init() {
        Task {
            await checkAuthentication()
        }
    }

    func checkAuthentication() async {
        let token = await KeychainManager.shared.readAccessToken()
        isAuthenticated = token != nil
    }

    func login(email: String, password: String) async throws {
        struct Body: Encodable, Sendable {
            let email: String
            let password: String
            let deviceName: String
        }

        let response: TokenResponse = try await APIClient.shared.request(
            method: .post,
            endpoint: .login,
            body: Body(email: email, password: password, deviceName: "iOS App")
        )

        try await store(response: response)
    }

    func signInWithApple(identityToken: String, authorizationCode: String, name: String?) async throws {
        struct Body: Encodable, Sendable {
            let identityToken: String
            let authorizationCode: String
            let name: String?
            let deviceName: String
        }

        let response: TokenResponse = try await APIClient.shared.request(
            method: .post,
            endpoint: .appleSignIn,
            body: Body(identityToken: identityToken, authorizationCode: authorizationCode, name: name, deviceName: "iOS App")
        )

        try await store(response: response)
    }

    func logout() async throws {
        try await APIClient.shared.request(method: .post, endpoint: .logout)
        try await KeychainManager.shared.clearTokens()
        isAuthenticated = false
        currentUser = nil
    }

    func logoutAll() async throws {
        try await APIClient.shared.request(method: .post, endpoint: .logoutAll)
        try await KeychainManager.shared.clearTokens()
        isAuthenticated = false
        currentUser = nil
    }

    private func store(response: TokenResponse) async throws {
        try await KeychainManager.shared.saveAccessToken(response.accessToken)
        try await KeychainManager.shared.saveRefreshToken(response.refreshToken)
        currentUser = response.user
        isAuthenticated = true
    }
}
