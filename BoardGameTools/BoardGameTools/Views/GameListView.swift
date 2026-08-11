import SwiftUI
import SwiftData

struct GameListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    @State private var isShowingAddSheet = false
    @State private var isShowingFilterSheet = false
    @State private var searchText = ""
    @State private var selectedTags: Set<String> = []
    @State private var selectedPlayerCount: Int?
    @State private var minComplexity: Int?
    @State private var sortOption: GameSortOption = .nameAsc
    @State private var errorMessage: String?

    private var allTags: [String] {
        Array(Set(localGames.flatMap { $0.tagNames })).sorted()
    }

    private var filteredGames: [LocalGame] {
        let filtered = localGames.filter { game in
            let matchesSearch = searchText.isEmpty || game.name.localizedStandardContains(searchText)
            let matchesTags = selectedTags.isEmpty || !Set(game.tagNames).isDisjoint(with: selectedTags)
            let matchesPlayers = selectedPlayerCount == nil || (game.minPlayers <= selectedPlayerCount! && game.maxPlayers >= selectedPlayerCount!)
            let matchesComplexity = minComplexity == nil || (game.complexity ?? 0) >= minComplexity!
            return matchesSearch && matchesTags && matchesPlayers && matchesComplexity
        }

        return filtered.sorted { lhs, rhs in
            switch sortOption {
            case .nameAsc:
                return lhs.name.localizedStandardCompare(rhs.name) == .orderedAscending
            case .nameDesc:
                return lhs.name.localizedStandardCompare(rhs.name) == .orderedDescending
            case .complexityAsc:
                return (lhs.complexity ?? 0) < (rhs.complexity ?? 0)
            case .complexityDesc:
                return (lhs.complexity ?? 0) > (rhs.complexity ?? 0)
            case .playersAsc:
                return lhs.minPlayers < rhs.minPlayers
            case .playersDesc:
                return lhs.maxPlayers > rhs.maxPlayers
            case .newest:
                return lhs.createdAt > rhs.createdAt
            }
        }
    }

    private var hasActiveFilters: Bool {
        !selectedTags.isEmpty || selectedPlayerCount != nil || minComplexity != nil || sortOption != .nameAsc
    }

    var body: some View {
        NavigationStack {
            List {
                if !networkMonitor.isOnline {
                    OfflineBanner()
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }

                ForEach(filteredGames) { game in
                    NavigationLink(destination: GameDetailView(game: game.toDTO())) {
                        GameRow(game: game)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Theme.cardBackground)
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Spiele")
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Spiel suchen")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        ForEach(GameSortOption.allCases) { option in
                            Button {
                                sortOption = option
                            } label: {
                                Label(option.label, systemImage: sortOption == option ? "checkmark" : "")
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down.circle")
                            .font(.title3)
                            .accessibilityLabel("Sortierung")
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingFilterSheet = true
                    } label: {
                        Image(systemName: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                            .font(.title3)
                            .foregroundStyle(Theme.primaryGradient)
                    }
                    .accessibilityLabel("Filter")
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Theme.primaryGradient)
                    }
                    .accessibilityLabel("Spiel hinzufügen")
                }
            }
            .sheet(isPresented: $isShowingAddSheet) {
                GameAddSheet()
                    .presentationDetents([.large])
            }
            .sheet(isPresented: $isShowingFilterSheet) {
                GameFilterSheet(
                    allTags: allTags,
                    selectedTags: $selectedTags,
                    selectedPlayerCount: $selectedPlayerCount,
                    minComplexity: $minComplexity,
                    sortOption: $sortOption
                )
            }
            .onAppear { Task { await syncEngine.sync() } }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localGames.isEmpty {
                    LoadingOverlay(message: "Lade Spiele...")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if filteredGames.isEmpty && !syncEngine.isSyncing {
                    EmptyStateView(icon: "magnifyingglass", title: "Keine Spiele", subtitle: "Passe deine Filter oder Suche an.")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GameRow: View {
    let game: LocalGame

    var body: some View {
        HStack(spacing: 16) {
            GameCover(imageUrl: game.imageUrl, name: game.name)

            VStack(alignment: .leading, spacing: 4) {
                Text(game.name)
                    .font(.headline)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                    Text("\(game.minPlayers)–\(game.maxPlayers)")
                    if let time = game.playTimeMinutes {
                        Text("·")
                        Image(systemName: "clock")
                        Text("\(time) min")
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                if let complexity = game.complexity {
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { index in
                            Image(systemName: index <= complexity ? "star.fill" : "star")
                                .font(.caption2)
                                .foregroundStyle(index <= complexity ? Theme.secondary : .gray.opacity(0.4))
                        }
                    }
                }

                if !game.tagNames.isEmpty {
                    Text(game.tagNames.joined(separator: ", "))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct GameCover: View {
    let imageUrl: String?
    let name: String

    var body: some View {
        ZStack {
            if let imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    case .failure, .empty:
                        placeholder
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: 64, height: 80)
        .clipShape(.rect(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }

    private var placeholder: some View {
        Theme.primaryGradient
            .overlay(
                Image(systemName: "dice")
                    .font(.title2)
                    .foregroundStyle(.white.opacity(0.7))
            )
    }
}
