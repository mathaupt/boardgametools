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
