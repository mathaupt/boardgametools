import Foundation
import SwiftUI

enum DeepLink: Identifiable, Hashable {
    case publicEvent(token: String)
    case event(id: String)
    case game(id: String)

    var id: String {
        switch self {
        case .publicEvent(let token): return "public-event-\(token)"
        case .event(let id): return "event-\(id)"
        case .game(let id): return "game-\(id)"
        }
    }
}

@Observable
@MainActor
final class DeepLinkManager {
    static let shared = DeepLinkManager()

    var currentTarget: DeepLink?

    private init() {}

    func handle(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let host = components.host else { return }

        let pathComponents = components.path.split(separator: "/").map(String.init)

        switch host {
        case "public":
            if pathComponents.count >= 2, pathComponents[0] == "event" {
                currentTarget = .publicEvent(token: pathComponents[1])
            }
        case "event":
            if let id = pathComponents.first {
                currentTarget = .event(id: id)
            }
        case "game":
            if let id = pathComponents.first {
                currentTarget = .game(id: id)
            }
        default:
            break
        }
    }

    func clear() {
        currentTarget = nil
    }
}
