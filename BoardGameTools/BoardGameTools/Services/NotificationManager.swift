import Foundation
import UserNotifications
import UIKit

@MainActor
final class NotificationManager: NSObject {
    static let shared = NotificationManager()

    private(set) var deviceToken: String?
    private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined

    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func requestAuthorization() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        authorizationStatus = settings.authorizationStatus

        guard settings.authorizationStatus == .notDetermined else { return }

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            authorizationStatus = granted ? .authorized : .denied
            if granted {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } catch {
            authorizationStatus = .denied
        }
    }

    func registerDeviceToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        deviceToken = token
        Task {
            await registerWithBackend(token: token)
        }
    }

    private func registerWithBackend(token: String) async {
        do {
            try await RemoteDataSource.shared.registerDevice(token: token, platform: "ios")
        } catch {
            print("Geräte-Token konnte nicht registriert werden: \(error.localizedDescription)")
        }
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        if let urlString = userInfo["deepLink"] as? String, let url = URL(string: urlString) {
            Task { @MainActor in
                DeepLinkManager.shared.handle(url: url)
            }
        }
        completionHandler()
    }
}
