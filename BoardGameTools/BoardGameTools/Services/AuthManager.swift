import Foundation
import Observation
import AuthenticationServices

@Observable
@MainActor
final class AuthManager {
    static let shared = AuthManager()

    private(set) var isAuthenticated: Bool = false
    private(set) var currentUser: UserDTO?

    private let apiClient: APIClient
    private let tokens: any TokenStorage
    private let accounts: LocalAccountStore
    private let invalidateSync: @MainActor () -> Void
    private var isTransitioning = false

    init(apiClient: APIClient = .shared, tokens: any TokenStorage = KeychainManager.shared,
         accounts: LocalAccountStore = .shared, restoreSession: Bool = true,
         invalidateSync: @escaping @MainActor () -> Void = { SyncEngine.shared.invalidate() }) {
        self.apiClient = apiClient
        self.tokens = tokens
        self.accounts = accounts
        self.invalidateSync = invalidateSync
        if restoreSession { Task { await checkAuthentication() } }
    }

    func checkAuthentication() async {
        guard !isTransitioning else { return }
        isTransitioning = true
        defer { isTransitioning = false }
        do {
            let owned = try accounts.restore(server: apiClient.baseURL.absoluteString)
            if !owned { try await tokens.clearTokens() }
            let token = await tokens.readAccessToken()
            isAuthenticated = owned && token != nil
        } catch {
            isAuthenticated = false
            try? await tokens.clearTokens()
        }
    }

    func login(email: String, password: String) async throws {
        guard !isTransitioning else { throw APIError.cancelled }
        isTransitioning = true
        defer { isTransitioning = false }
        invalidateSession()
        struct Body: Encodable, Sendable {
            let email: String
            let password: String
            let deviceName: String
        }

        let response: TokenResponse = try await apiClient.request(
            method: .post,
            endpoint: .login,
            body: Body(email: email, password: password, deviceName: "iOS App"),
            requiresAuth: false
        )

        try await store(response: response)
    }

    func signInWithApple(identityToken: String, authorizationCode: String, name: String?) async throws {
        guard !isTransitioning else { throw APIError.cancelled }
        isTransitioning = true
        defer { isTransitioning = false }
        invalidateSession()
        struct Body: Encodable, Sendable {
            let identityToken: String
            let authorizationCode: String
            let name: String?
            let deviceName: String
        }

        let response: TokenResponse = try await apiClient.request(
            method: .post,
            endpoint: .appleSignIn,
            body: Body(identityToken: identityToken, authorizationCode: authorizationCode, name: name, deviceName: "iOS App"),
            requiresAuth: false
        )

        try await store(response: response)
    }

    private func invalidateSession() {
        isAuthenticated = false
        currentUser = nil
        apiClient.invalidateSession()
        invalidateSync()
    }

    func logout() async throws { try await endSession(endpoint: .logout) }
    func logoutAll() async throws { try await endSession(endpoint: .logoutAll) }

    private func endSession(endpoint: Endpoint) async throws {
        guard !isTransitioning else { throw APIError.cancelled }
        isTransitioning = true
        defer { isTransitioning = false }
        invalidateSession()
        var cleanupError: Error?
        do { try accounts.clear() } catch { cleanupError = error }
        // Revoke at the current server before changing the base URL. Local logout
        // still succeeds when that server is unreachable.
        try? await apiClient.request(method: .post, endpoint: endpoint)
        do { try await tokens.clearTokens() } catch { cleanupError = cleanupError ?? error }
        if let cleanupError { throw cleanupError }
    }

    func changeBackend(to url: URL) async throws {
        try APIClient.validate(url)
        try await logout()
        try apiClient.updateBaseURL(url)
    }

    func updateProfile(name: String? = nil, currentPassword: String? = nil, newPassword: String? = nil) async throws -> UserDTO {
        struct Body: Encodable, Sendable {
            let name: String?
            let currentPassword: String?
            let newPassword: String?
        }

        let response: ProfileResponse = try await apiClient.request(
            method: .put,
            endpoint: .me,
            body: Body(name: name, currentPassword: currentPassword, newPassword: newPassword)
        )

        currentUser = response.user
        return response.user
    }

    private func store(response: TokenResponse) async throws {
        do {
            try accounts.activate(server: apiClient.baseURL.absoluteString, userID: response.user.id)
            try await tokens.saveAccessToken(response.accessToken)
            try await tokens.saveRefreshToken(response.refreshToken)
            currentUser = response.user
            isAuthenticated = true
        } catch {
            try? await tokens.clearTokens()
            try? accounts.clear()
            throw error
        }
    }
}
