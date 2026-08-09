import Foundation

enum Endpoint: Sendable {
    // Auth
    case login
    case refresh
    case logout
    case logoutAll
    case appleSignIn

    // Me / Dashboard / Sync
    case me
    case dashboard
    case sync

    // Games
    case games
    case game(String)
    case gameSessions(String)

    // Sessions
    case sessions
    case session(String)

    // Events
    case events
    case event(String)
    case closeEvent(String)
    case eventProposals(String)
    case eventVotes(String)
    case eventDateProposals(String)
    case eventDateVotes(String)

    // Groups
    case groups
    case group(String)
    case joinGroup(String)
    case groupPolls(String)
    case groupPollVote(String, String)
    case groupComments(String)

    // BGG
    case bggSearch(query: String)
    case bggLookup
    case bggImport

    // Upload / Devices
    case upload
    case devices

    // Public
    case publicEvent(String)
    case publicEventJoin(String)
    case publicEventVote(String)

    var path: String {
        switch self {
        case .login: return "/api/mobile/v1/auth/login"
        case .refresh: return "/api/mobile/v1/auth/refresh"
        case .logout: return "/api/mobile/v1/auth/logout"
        case .logoutAll: return "/api/mobile/v1/auth/logout-all"
        case .appleSignIn: return "/api/mobile/v1/auth/apple"
        case .me: return "/api/mobile/v1/me"
        case .dashboard: return "/api/mobile/v1/dashboard"
        case .sync: return "/api/mobile/v1/sync"
        case .games: return "/api/mobile/v1/games"
        case .game(let id): return "/api/mobile/v1/games/\(id)"
        case .gameSessions(let id): return "/api/mobile/v1/games/\(id)/sessions"
        case .sessions: return "/api/mobile/v1/sessions"
        case .session(let id): return "/api/mobile/v1/sessions/\(id)"
        case .events: return "/api/mobile/v1/events"
        case .event(let id): return "/api/mobile/v1/events/\(id)"
        case .closeEvent(let id): return "/api/mobile/v1/events/\(id)/close"
        case .eventProposals(let id): return "/api/mobile/v1/events/\(id)/proposals"
        case .eventVotes(let id): return "/api/mobile/v1/events/\(id)/votes"
        case .eventDateProposals(let id): return "/api/mobile/v1/events/\(id)/date-proposals"
        case .eventDateVotes(let id): return "/api/mobile/v1/events/\(id)/date-proposals/vote"
        case .groups: return "/api/mobile/v1/groups"
        case .group(let id): return "/api/mobile/v1/groups/\(id)"
        case .joinGroup(let id): return "/api/mobile/v1/groups/\(id)/join"
        case .groupPolls(let id): return "/api/mobile/v1/groups/\(id)/polls"
        case .groupPollVote(let id, let pollId): return "/api/mobile/v1/groups/\(id)/polls/\(pollId)/vote"
        case .groupComments(let id): return "/api/mobile/v1/groups/\(id)/comments"
        case .bggSearch: return "/api/mobile/v1/bgg/search"
        case .bggLookup: return "/api/mobile/v1/bgg/lookup"
        case .bggImport: return "/api/mobile/v1/bgg/import"
        case .upload: return "/api/mobile/v1/uploads"
        case .devices: return "/api/mobile/v1/devices"
        case .publicEvent(let token): return "/api/mobile/v1/public/event/\(token)"
        case .publicEventJoin(let token): return "/api/mobile/v1/public/event/\(token)/join"
        case .publicEventVote(let token): return "/api/mobile/v1/public/event/\(token)/vote"
        }
    }

    var queryItems: [URLQueryItem]? {
        switch self {
        case .bggSearch(let query):
            return [URLQueryItem(name: "q", value: query)]
        default:
            return nil
        }
    }

    func url(base: URL) -> URL? {
        guard var components = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            return nil
        }
        if let queryItems = queryItems {
            components.queryItems = queryItems
        }
        return components.url
    }
}
