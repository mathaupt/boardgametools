import SwiftUI

/// Adaptive roles for the four Club Programme surfaces.
enum ClubTheme {
    private static func adaptive(_ light: UInt32, _ dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: Double((hex >> 16) & 255) / 255,
                           green: Double((hex >> 8) & 255) / 255,
                           blue: Double(hex & 255) / 255, alpha: 1)
        })
    }

    static let tint = adaptive(0x2445B4, 0xA8BAFF)
    static let onTint = adaptive(0xFFFFFF, 0x172648)
    static let background = adaptive(0xEAF0FF, 0x151923)
    static let surface = adaptive(0xFFFFFF, 0x202637)
    static let ink = adaptive(0x172648, 0xEDF1FF)
    static let secondaryInk = adaptive(0x4A5B7E, 0xB6C2DE)
    static let softBlue = adaptive(0xDCE5FC, 0x2B3652)
    static let dateBackground = adaptive(0xF4AF85, 0xE8AC88)
    static let dateInk = Color(red: 84 / 255, green: 47 / 255, blue: 32 / 255)

    struct Surface: ViewModifier {
        func body(content: Content) -> some View {
            content.padding(20).background(surface, in: .rect(cornerRadius: 14))
        }
    }

    struct PrimaryButton: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(.headline)
                .frame(maxWidth: .infinity, minHeight: 44)
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .foregroundStyle(onTint)
                .background(tint, in: .rect(cornerRadius: 10))
                .opacity(configuration.isPressed ? 0.8 : 1)
        }
    }
}

enum Theme {
    // Brand palette
    static let primary = Color.indigo
    static let secondary = Color.orange
    static let success = Color.green
    static let warning = Color.orange
    static let error = Color.red

    // Backgrounds
    static let background = Color(uiColor: .systemGroupedBackground)
    static let cardBackground = Color(uiColor: .secondarySystemGroupedBackground)
    static let elevated = Color.white.opacity(0.12)

    // Gradients
    static var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [Color.indigo, Color.purple],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var warmGradient: LinearGradient {
        LinearGradient(
            colors: [Color.orange, Color.yellow],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var coolGradient: LinearGradient {
        LinearGradient(
            colors: [Color.cyan, Color.teal],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var roseGradient: LinearGradient {
        LinearGradient(
            colors: [Color.pink, Color.red],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Typography
    static func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.title3)
            .fontWeight(.bold)
            .foregroundStyle(.primary)
    }

    // View Modifiers
    struct Card: ViewModifier {
        func body(content: Content) -> some View {
            content
                .padding()
                .background(Theme.cardBackground)
                .clipShape(.rect(cornerRadius: 16))
                .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 4)
        }
    }

    struct GradientButton: ViewModifier {
        let gradient: LinearGradient

        func body(content: Content) -> some View {
            content
                .fontWeight(.semibold)
                .foregroundStyle(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(gradient)
                .clipShape(.capsule)
        }
    }
}

extension View {
    func themeCard() -> some View {
        modifier(Theme.Card())
    }

    func themeGradientButton(_ gradient: LinearGradient = Theme.primaryGradient) -> some View {
        modifier(Theme.GradientButton(gradient: gradient))
    }
}
