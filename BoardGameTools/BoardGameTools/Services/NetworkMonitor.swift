import Foundation
import Network
import Combine

@Observable
@MainActor
final class NetworkMonitor {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    private(set) var isOnline = true
    private(set) var connectionType = "Unbekannt"

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }
            Task { @MainActor in
                self.isOnline = path.status == .satisfied
                self.connectionType = self.name(for: path)
            }
        }
        monitor.start(queue: queue)
    }

    private func name(for path: NWPath) -> String {
        if path.usesInterfaceType(.wifi) { return "WLAN" }
        if path.usesInterfaceType(.cellular) { return "Mobil" }
        if path.usesInterfaceType(.wiredEthernet) { return "LAN" }
        return "Unbekannt"
    }
}
