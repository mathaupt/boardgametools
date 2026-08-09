import Foundation

extension String {
    func formattedISO8601() -> String? {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: self) else { return nil }
        let display = DateFormatter()
        display.dateStyle = .medium
        display.timeStyle = .short
        display.locale = Locale(identifier: "de_DE")
        return display.string(from: date)
    }
}
