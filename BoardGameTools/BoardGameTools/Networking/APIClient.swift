import Foundation

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
    private var isRefreshing = false
    private var pendingRefreshContinuations: [CheckedContinuation<Void, Error>] = []

    private init() {
        let infoDefault = Bundle.main.infoDictionary?["API_BASE_URL"] as? String
        let fallback = infoDefault ?? "https://boardgametools.vercel.app"

        if let saved = UserDefaults.standard.string(forKey: "api_base_url"),
           let url = URL(string: saved),
           (try? Self.validate(url)) != nil {
            self.baseURL = url
        } else if let url = URL(string: fallback),
                  (try? Self.validate(url)) != nil {
            self.baseURL = url
        } else {
            self.baseURL = URL(string: "https://boardgametools.vercel.app")!
        }
        self.session = URLSession(configuration: .default)
    }

    func updateBaseURL(_ url: URL) throws(APIError) {
        try Self.validate(url)
        self.baseURL = url
    }

    private static func validate(_ url: URL) throws(APIError) {
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
        requiresAuth: Bool = true
    ) async throws -> Data {
        return try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth)
    }

    // MARK: - Upload

    func upload(imageData: Data, fileName: String, mimeType: String) async throws -> UploadResponse {
        guard let url = Endpoint.upload.url(base: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue

        if let token = await KeychainManager.shared.readAccessToken() {
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
        requiresAuth: Bool = true
    ) async throws -> Data {
        if requiresAuth {
            await ensureAccessTokenValid()
        }

        guard let url = endpoint.url(base: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if requiresAuth, let token = await KeychainManager.shared.readAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONConfig.encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        do {
            try validate(response: response, data: data)
        } catch APIError.unauthorized {
            if requiresAuth {
                try await refreshAccessToken()
                return try await perform(method: method, endpoint: endpoint, body: body, requiresAuth: requiresAuth)
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

    private func ensureAccessTokenValid() async {
        // Refresh happens reactively on 401. This could be enhanced by decoding exp claim.
    }

    private func refreshAccessToken() async throws {
        guard let refreshToken = await KeychainManager.shared.readRefreshToken() else {
            throw APIError.unauthorized
        }

        if isRefreshing {
            return try await withCheckedThrowingContinuation { continuation in
                pendingRefreshContinuations.append(continuation)
            }
        }

        isRefreshing = true
        defer {
            isRefreshing = false
            let continuations = pendingRefreshContinuations
            pendingRefreshContinuations.removeAll()
            continuations.forEach { $0.resume() }
        }

        struct RefreshBody: Encodable, Sendable {
            let refreshToken: String
            let deviceName: String
        }

        guard let url = Endpoint.refresh.url(base: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONConfig.encoder.encode(RefreshBody(refreshToken: refreshToken, deviceName: "iOS App"))

        let (data, response) = try await session.data(for: request)
        do {
            try validate(response: response, data: data)
        } catch {
            try await KeychainManager.shared.clearTokens()
            throw APIError.unauthorized
        }

        let tokenResponse = try JSONConfig.decoder.decode(TokenResponse.self, from: data)
        try await KeychainManager.shared.saveAccessToken(tokenResponse.accessToken)
        try await KeychainManager.shared.saveRefreshToken(tokenResponse.refreshToken)
    }
}
