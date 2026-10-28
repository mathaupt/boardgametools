import Foundation
import Observation

protocol TokenStorage: Sendable {
    func readAccessToken() async -> String?
    func readRefreshToken() async -> String?
    func saveAccessToken(_ token: String) async throws
    func saveRefreshToken(_ token: String) async throws
    func clearTokens() async throws
}

@Observable
@MainActor
final class APIClient: Sendable {
    static let shared = APIClient()

    private(set) var baseURL: URL {
        didSet {
            UserDefaults.standard.set(baseURL.absoluteString, forKey: "api_base_url")
        }
    }

    private let session: URLSession
    private let tokens: any TokenStorage
    private var refreshTask: Task<Void, Error>?
    private(set) var sessionGeneration = 0

    private convenience init() {
        let infoDefault = Bundle.main.infoDictionary?["API_BASE_URL"] as? String
        let fallback = infoDefault ?? "https://boardgametools.vercel.app"

        if let saved = UserDefaults.standard.string(forKey: "api_base_url"),
           let url = URL(string: saved),
           (try? Self.validate(url)) != nil {
            self.init(baseURL: url)
        } else if let url = URL(string: fallback),
                  (try? Self.validate(url)) != nil {
            self.init(baseURL: url)
        } else {
            self.init(baseURL: URL(string: "https://boardgametools.vercel.app")!)
        }
    }

    init(baseURL: URL, session: URLSession = URLSession(configuration: .default), tokens: any TokenStorage = KeychainManager.shared) {
        self.baseURL = baseURL
        self.session = session
        self.tokens = tokens
    }

    func invalidateSession() {
        sessionGeneration += 1
        refreshTask?.cancel()
        refreshTask = nil
    }

    func updateBaseURL(_ url: URL) throws(APIError) {
        try Self.validate(url)
        invalidateSession()
        self.baseURL = url
    }

    static func validate(_ url: URL) throws(APIError) {
        guard let scheme = url.scheme?.lowercased() else {
            throw .invalidURL
        }

        #if DEBUG
        if scheme == "http" {
            guard let host = url.host?.lowercased(),
                  host == "localhost" || host == "127.0.0.1" else {
                throw .insecureURL
            }
        } else if scheme != "https" {
            throw .invalidURL
        }
        #else
        guard scheme == "https" else {
            throw .insecureURL
        }
        #endif

        guard let host = url.host, !host.isEmpty else {
            throw .invalidURL
        }
    }

    // MARK: - Generic requests

    func request<T: Decodable & Sendable>(
        method: HTTPMethod,
        endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        let data = try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth)
        do {
            return try JSONConfig.decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error.localizedDescription)
        }
    }

    func request(
        method: HTTPMethod,
        endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil,
        requiresAuth: Bool = true
    ) async throws {
        _ = try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth)
    }

    func requestData(
        method: HTTPMethod,
        endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil,
        requiresAuth: Bool = true,
        allowRefresh: Bool = true
    ) async throws -> Data {
        return try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth, allowRefresh: allowRefresh)
    }

    // MARK: - Upload

    func upload(imageData: Data, fileName: String, mimeType: String) async throws -> UploadResponse {
        guard let url = Endpoint.upload.url(base: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue

        if let token = await tokens.readAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        let (data, response) = try await session.upload(for: request, from: body)
        try validate(response: response, data: data)
        return try JSONConfig.decoder.decode(UploadResponse.self, from: data)
    }

    // MARK: - Internal

    @discardableResult
    private func perform(
        method: HTTPMethod,
        endpoint: Endpoint,
        body: (any Encodable & Sendable)? = nil,
        requiresAuth: Bool = true,
        allowRefresh: Bool = true
    ) async throws -> Data {
        let generation = sessionGeneration
        guard let url = endpoint.url(base: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if requiresAuth, let token = await tokens.readAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONConfig.encoder.encode(body)
        }

        guard generation == sessionGeneration else { throw APIError.cancelled }
        let (data, response) = try await session.data(for: request)
        guard generation == sessionGeneration else { throw APIError.cancelled }
        do {
            try validate(response: response, data: data)
        } catch APIError.unauthorized {
            if requiresAuth && allowRefresh && endpoint != .logout && endpoint != .logoutAll {
                try await refreshAccessToken()
                guard generation == sessionGeneration else { throw APIError.cancelled }
                return try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth, allowRefresh: false)
            } else {
                throw APIError.unauthorized
            }
        }
        return data
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        switch http.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        case 409:
            throw APIError.conflict
        case 400:
            if let errorBody = try? JSONConfig.decoder.decode(APIErrorResponse.self, from: data) {
                throw APIError.badRequest(errorBody.error)
            }
            throw APIError.badRequest("Ungültige Anfrage")
        default:
            throw APIError.serverError(http.statusCode)
        }
    }

    private func refreshAccessToken() async throws {
        if let refreshTask {
            return try await refreshTask.value
        }
        let generation = sessionGeneration
        let task = Task { @MainActor in
            guard let refreshToken = await tokens.readRefreshToken() else {
                throw APIError.unauthorized
            }
            guard let url = Endpoint.refresh.url(base: baseURL) else {
                throw APIError.invalidURL
            }
            struct RefreshBody: Encodable { let refreshToken: String }
            var request = URLRequest(url: url)
            request.httpMethod = HTTPMethod.post.rawValue
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONConfig.encoder.encode(RefreshBody(refreshToken: refreshToken))
            let (data, response) = try await session.data(for: request)
            try Task.checkCancellation()
            guard generation == sessionGeneration else { throw APIError.cancelled }
            do {
                try validate(response: response, data: data)
            } catch APIError.unauthorized {
                try await tokens.clearTokens()
                throw APIError.unauthorized
            }
            let responseTokens = try JSONConfig.decoder.decode(RefreshTokenResponse.self, from: data)
            try await tokens.saveAccessToken(responseTokens.accessToken)
            try Task.checkCancellation()
            guard generation == sessionGeneration else { throw APIError.cancelled }
            try await tokens.saveRefreshToken(responseTokens.refreshToken)
        }
        refreshTask = task
        defer {
            if generation == sessionGeneration { refreshTask = nil }
        }
        do {
            try await task.value
        } catch {
            if generation != sessionGeneration { throw APIError.cancelled }
            throw error
        }
    }
}
