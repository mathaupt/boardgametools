import Foundation

enum APIError: Error, Equatable {
    case invalidURL
    case insecureURL
    case unauthorized
    case notFound
    case conflict
    case badRequest(String)
    case serverError(Int)
    case networkError(Error)
    case decodingError(String)
    case unknown
    case cancelled

    var message: String {
        switch self {
        case .invalidURL: return "Ungültige URL"
        case .insecureURL: return "Nur HTTPS-URLs sind erlaubt"
        case .unauthorized: return "Nicht autorisiert. Bitte melde dich erneut an."
        case .notFound: return "Nicht gefunden"
        case .conflict: return "Konflikt – möglicherweise bereits vorhanden."
        case .badRequest(let msg): return msg
        case .serverError(let code): return "Serverfehler (\(code))"
        case .networkError: return "Netzwerkfehler. Bitte Verbindung prüfen."
        case .decodingError(let msg): return "Daten konnten nicht gelesen werden: \(msg)"
        case .unknown: return "Unbekannter Fehler"
        case .cancelled: return "Anfrage abgebrochen"
        }
    }

    static func == (lhs: APIError, rhs: APIError) -> Bool {
        switch (lhs, rhs) {
        case (.invalidURL, .invalidURL), (.insecureURL, .insecureURL), (.unauthorized, .unauthorized), (.notFound, .notFound),
             (.conflict, .conflict), (.unknown, .unknown), (.cancelled, .cancelled):
            return true
        case (.badRequest(let a), .badRequest(let b)): return a == b
        case (.serverError(let a), .serverError(let b)): return a == b
        case (.decodingError(let a), .decodingError(let b)): return a == b
        case (.networkError, .networkError): return true
        default: return false
        }
    }
}

struct APIErrorResponse: Decodable, Sendable {
    let error: String
}
