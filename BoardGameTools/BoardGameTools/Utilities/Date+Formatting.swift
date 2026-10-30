import Foundation

private func makeFormatter() -> ISO8601DateFormatter {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
}

extension Date {
    func iso8601String() -> String {
        makeFormatter().string(from: self)
    }
}

extension String {
    func iso8601Date() -> Date? {
        makeFormatter().date(from: self)
    }
}

/// Compare parsed instants rather than the lexical order of server timestamps.
enum ClubContent {
    static func date(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: value) ?? value.iso8601Date()
    }

    static func nextEvent(in events: [EventDTO], now: Date = .now) -> EventDTO? {
        events.compactMap { event -> (EventDTO, Date)? in
            guard event.deletedAt == nil, let date = date(event.eventDate), date >= now else { return nil }
            return (event, date)
        }
        .sorted { $0.1 == $1.1 ? $0.0.id < $1.0.id : $0.1 < $1.1 }
        .first?.0
    }

    static func recentSessions(in sessions: [SessionDTO], limit: Int = 3) -> [SessionDTO] {
        sessions.compactMap { session -> (SessionDTO, Date)? in
            guard session.deletedAt == nil, let date = date(session.playedAt) else { return nil }
            return (session, date)
        }
        .sorted { $0.1 == $1.1 ? $0.0.id < $1.0.id : $0.1 > $1.1 }
        .prefix(max(0, limit))
        .map { $0.0 }
    }
}
