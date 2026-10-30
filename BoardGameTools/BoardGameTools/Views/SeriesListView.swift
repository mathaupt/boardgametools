import SwiftUI
import SwiftData

enum SeriesSortOption: String, CaseIterable, Identifiable {
    case nameAsc = "name_asc"
    case nameDesc = "name_desc"
    case progressDesc = "progress_desc"
    case entriesDesc = "entries_desc"
    case newest = "newest"
    case oldest = "oldest"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .nameAsc: return "Name (A–Z)"
        case .nameDesc: return "Name (Z–A)"
        case .progressDesc: return "Fortschritt"
        case .entriesDesc: return "Meiste Einträge"
        case .newest: return "Neueste zuerst"
        case .oldest: return "Älteste zuerst"
        }
    }
}

struct SeriesListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalGameSeries.name) private var localSeries: [LocalGameSeries]
    @State private var isShowingAddSheet = false
    @State private var searchText = ""
    @State private var sortOption: SeriesSortOption = .nameAsc
    @State private var errorMessage: String?

    private var filteredSeries: [LocalGameSeries] {
        let filtered = localSeries.filter { series in
            searchText.isEmpty || series.name.localizedStandardContains(searchText) || (series.desc ?? "").localizedStandardContains(searchText)
        }

        return filtered.sorted { lhs, rhs in
            switch sortOption {
            case .nameAsc:
                return lhs.name.localizedStandardCompare(rhs.name) == .orderedAscending
            case .nameDesc:
                return lhs.name.localizedStandardCompare(rhs.name) == .orderedDescending
            case .progressDesc:
                return progress(for: lhs) > progress(for: rhs)
            case .entriesDesc:
                return (lhs.entries?.count ?? 0) > (rhs.entries?.count ?? 0)
            case .newest:
                return lhs.createdAt > rhs.createdAt
            case .oldest:
                return lhs.createdAt < rhs.createdAt
            }
        }
    }

    private func progress(for series: LocalGameSeries) -> Double {
        let entries = series.entries ?? []
        let total = entries.count
        let played = entries.filter { $0.played }.count
        return total > 0 ? Double(played) / Double(total) : 0
    }

    var body: some View {
        List {
            if !networkMonitor.isOnline {
                OfflineBanner()
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }

            ForEach(filteredSeries) { series in
                NavigationLink(destination: SeriesDetailView(series: series)) {
                    SeriesRow(series: series)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Theme.cardBackground)
                .listRowSeparator(.hidden)
            }
        }
        .listStyle(.plain)
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Reihen")
        .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Reihe suchen")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Menu {
                    ForEach(SeriesSortOption.allCases) { option in
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
                    isShowingAddSheet = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Theme.primaryGradient)
                }
                .accessibilityLabel("Neue Reihe")
            }
        }
        .sheet(isPresented: $isShowingAddSheet) {
            SeriesEditView()
                .presentationDetents([.large])
        }
        .onAppear { Task { await syncEngine.sync() } }
        .refreshable { await syncEngine.sync() }
        .overlay {
            if syncEngine.isSyncing && localSeries.isEmpty {
                LoadingOverlay(message: "Lade Reihen...")
            } else if let errorMessage = errorMessage {
                EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
            } else if filteredSeries.isEmpty && !syncEngine.isSyncing {
                EmptyStateView(icon: "rectangle.stack", title: "Noch keine Reihen", subtitle: "Erstelle eine Reihe für EXIT, Adventure Games oder ähnliche Serien.")
            }
        }
        .onChange(of: syncEngine.errorMessage) { _, new in
            errorMessage = new
        }

    }
}

struct SeriesRow: View {
    let series: LocalGameSeries

    private var progress: Double {
        let entries = series.entries ?? []
        let total = entries.count
        let played = entries.filter { $0.played }.count
        return total > 0 ? Double(played) / Double(total) : 0
    }

    var body: some View {
        HStack(spacing: 16) {
            GameCover(imageUrl: series.imageUrl, name: series.name)

            VStack(alignment: .leading, spacing: 6) {
                Text(series.name)
                    .font(.headline)
                    .lineLimit(1)

                if let desc = series.desc, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                HStack(spacing: 4) {
                    Image(systemName: "dice")
                    Text("\(series.entries?.count ?? 0) Spiele")
                    Spacer()
                    Text("\(Int(progress * 100)) %")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                ProgressView(value: progress)
                    .tint(Theme.primaryGradient)
                    .scaleEffect(x: 1, y: 1.5, anchor: .center)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}
