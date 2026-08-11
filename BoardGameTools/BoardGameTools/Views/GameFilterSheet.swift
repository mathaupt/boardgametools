import SwiftUI

enum GameSortOption: String, CaseIterable, Identifiable {
    case nameAsc = "name_asc"
    case nameDesc = "name_desc"
    case complexityAsc = "complexity_asc"
    case complexityDesc = "complexity_desc"
    case playersAsc = "players_asc"
    case playersDesc = "players_desc"
    case newest = "newest"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .nameAsc: return "Name (A–Z)"
        case .nameDesc: return "Name (Z–A)"
        case .complexityAsc: return "Komplexität (niedrig → hoch)"
        case .complexityDesc: return "Komplexität (hoch → niedrig)"
        case .playersAsc: return "Spieler (wenigste)"
        case .playersDesc: return "Spieler (meiste)"
        case .newest: return "Zuletzt hinzugefügt"
        }
    }
}

struct GameFilterSheet: View {
    let allTags: [String]
    @Binding var selectedTags: Set<String>
    @Binding var selectedPlayerCount: Int?
    @Binding var minComplexity: Int?
    @Binding var sortOption: GameSortOption
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Sortierung") {
                    Picker("Sortierung", selection: $sortOption) {
                        ForEach(GameSortOption.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .pickerStyle(.inline)
                    .accessibilityLabel("Sortierung auswählen")
                }

                Section("Spieleranzahl") {
                    Picker("Spieleranzahl", selection: $selectedPlayerCount) {
                        Text("Alle").tag(nil as Int?)
                        ForEach(1...12, id: \.self) { count in
                            Text("\(count) Spieler").tag(count as Int?)
                        }
                    }
                    .pickerStyle(.menu)
                    .accessibilityLabel("Spieleranzahl filtern")
                }

                Section("Mindest-Komplexität") {
                    HStack(spacing: 8) {
                        ForEach(0...5, id: \.self) { star in
                            Button {
                                minComplexity = star == 0 ? nil : star
                            } label: {
                                Image(systemName: star == 0 ? "xmark.circle" : (minComplexity ?? 0) >= star ? "star.fill" : "star")
                                    .font(.title2)
                                    .foregroundStyle(star == 0 ? .secondary : Theme.secondary)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(star == 0 ? "Keine Komplexitätsfilter" : "Mindestens \(star) Sterne")
                        }
                    }
                }

                if !allTags.isEmpty {
                    Section("Tags") {
                        FlowLayout(spacing: 8) {
                            ForEach(allTags, id: \.self) { tag in
                                let isSelected = selectedTags.contains(tag)
                                Button {
                                    if isSelected {
                                        selectedTags.remove(tag)
                                    } else {
                                        selectedTags.insert(tag)
                                    }
                                } label: {
                                    Text(tag)
                                        .font(.subheadline)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(isSelected ? Theme.primary : Color(.systemGray6))
                                        .foregroundStyle(isSelected ? .white : .primary)
                                        .clipShape(.capsule)
                                }
                                .buttonStyle(.plain)
                                .accessibilityHint(isSelected ? "Ausgewählt" : "Nicht ausgewählt")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") { dismiss() }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button("Zurücksetzen") {
                        selectedTags.removeAll()
                        selectedPlayerCount = nil
                        minComplexity = nil
                        sortOption = .nameAsc
                    }
                }
            }
        }
    }
}
