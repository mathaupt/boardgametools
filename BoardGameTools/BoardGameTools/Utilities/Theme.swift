import SwiftUI

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
