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
                    .listRowBackground(ClubTheme.surface)
                    .listRowSeparator(.visible)
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(ClubTheme.background.ignoresSafeArea())
            .navigationTitle("Spiele")
            .tint(ClubTheme.tint)
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
                            .foregroundStyle(ClubTheme.tint)
                    }
                    .accessibilityLabel("Filter")
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(ClubTheme.tint)
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
                    ContentUnavailableView {
                        Label(localGames.isEmpty ? "Deine Sammlung beginnt hier" : "Keine passenden Spiele",
                              systemImage: localGames.isEmpty ? "dice" : "magnifyingglass")
                    } description: {
                        Text(localGames.isEmpty ? "Füge dein erstes Spiel hinzu oder importiere es aus BoardGameGeek." : "Ändere deine Suche oder setze die Filter zurück.")
                    } actions: {
                        if localGames.isEmpty {
                            Button("Spiel hinzufügen") { isShowingAddSheet = true }
                                .buttonStyle(.borderedProminent)
                        } else {
                            Button("Suche und Filter zurücksetzen") {
                                searchText = ""
                                selectedTags = []
                                selectedPlayerCount = nil
                                minComplexity = nil
                                sortOption = .nameAsc
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GameRow: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    let game: LocalGame

    var body: some View {
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12))
            : AnyLayout(HStackLayout(spacing: 16))
        layout {
            GameCover(imageUrl: game.imageUrl, name: game.name)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 6) {
                Text(game.name)
                    .font(.headline)
                    .foregroundStyle(ClubTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(metadata)
                    .font(.subheadline)
                    .foregroundStyle(ClubTheme.secondaryInk)
                if let complexity = game.complexity {
                    Text("Komplexität: \(complexity) von 5")
                        .font(.footnote)
                        .foregroundStyle(ClubTheme.secondaryInk)
                }
                if !game.tagNames.isEmpty {
                    Text(game.tagNames.joined(separator: " · "))
                        .font(.footnote)
                        .foregroundStyle(ClubTheme.secondaryInk)
                        .lineLimit(typeSize.isAccessibilitySize ? nil : 2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .combine)
    }

    private var metadata: String {
        let players = "\(game.minPlayers)–\(game.maxPlayers) Personen"
        return game.playTimeMinutes.map { "\(players) · \($0) Min." } ?? players
    }
}

struct GameCover: View {
    let imageUrl: String?
    let name: String

    var body: some View {
        ZStack {
            ClubTheme.softBlue
            if let imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFit()
                    } else {
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: 64, height: 80)
        .clipShape(.rect(cornerRadius: 8))
        .accessibilityLabel("Cover: \(name)")
    }

    private var placeholder: some View {
        Image(systemName: "dice")
            .font(.title2)
            .foregroundStyle(ClubTheme.tint)
    }
}
