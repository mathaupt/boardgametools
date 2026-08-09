import Foundation
import Security

enum KeychainError: Error {
    case itemNotFound
    case duplicateItem
    case invalidStatus(OSStatus)
    case conversionFailed
}

actor KeychainManager {
    static let shared = KeychainManager()

    private init() {}

    func save(service: String, account: String, data: Data) async throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        if status == errSecDuplicateItem {
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: account,
            ]
            let attributes: [String: Any] = [kSecValueData as String: data]
            let updateStatus = SecItemUpdate(updateQuery as CFDictionary, attributes as CFDictionary)
            guard updateStatus == errSecSuccess else {
                throw KeychainError.invalidStatus(updateStatus)
            }
        } else if status != errSecSuccess {
            throw KeychainError.invalidStatus(status)
        }
    }

    func read(service: String, account: String) async throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.invalidStatus(status)
        }
        guard let data = result as? Data else {
            throw KeychainError.conversionFailed
        }
        return data
    }

    func delete(service: String, account: String) async throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.invalidStatus(status)
        }
    }
}

extension KeychainManager {
    private static let service = "com.boardgametools.ios.tokens"
    private static let accessAccount = "accessToken"
    private static let refreshAccount = "refreshToken"

    func saveAccessToken(_ token: String) async throws {
        try await save(service: Self.service, account: Self.accessAccount, data: Data(token.utf8))
    }

    func readAccessToken() async -> String? {
        guard let data = try? await read(service: Self.service, account: Self.accessAccount) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func deleteAccessToken() async throws {
        try await delete(service: Self.service, account: Self.accessAccount)
    }

    func saveRefreshToken(_ token: String) async throws {
        try await save(service: Self.service, account: Self.refreshAccount, data: Data(token.utf8))
    }

    func readRefreshToken() async -> String? {
        guard let data = try? await read(service: Self.service, account: Self.refreshAccount) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func deleteRefreshToken() async throws {
        try await delete(service: Self.service, account: Self.refreshAccount)
    }

    func clearTokens() async throws {
        try await deleteAccessToken()
        try await deleteRefreshToken()
    }
}
