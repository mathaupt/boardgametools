import SwiftUI

struct BGGSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selected: BGGSearchResult?

    var body: some View {
        NavigationStack {
            BGGSearchPanel(onSelect: { selected = $0 })
                .navigationTitle("BGG-Import")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fertig") { dismiss() } } }
                .sheet(item: $selected) { result in
                    BGGImportSheet(result: result) { dismiss() }
                }
        }.tint(ClubTheme.tint)
    }
}

struct BGGSearchPanel: View {
    let onSelect: (BGGSearchResult) -> Void
    var selectedIDs: Set<String> = []
    @State private var query = ""
    @State private var search = NativeBGGSearch()

    var body: some View {
        List {
            Section {
                TextField("Spiel auf BoardGameGeek suchen", text: $query)
                    .textInputAutocapitalization(.never)
                    .submitLabel(.search)
                    .onSubmit { submit() }
                    .onChange(of: query) { _, _ in search.reset() }
                    .accessibilityLabel("Spiel auf BoardGameGeek suchen")
                Button("Suchen", systemImage: "magnifyingglass") { submit() }
                    .frame(minHeight: 44)
                    .disabled(query.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 || query.count > 200 || search.state == .loading)
            }
            switch search.state {
            case .idle:
                Text("Gib mindestens zwei Zeichen ein und starte die Suche.").foregroundStyle(.secondary)
            case .loading:
                ProgressView("Suche auf BoardGameGeek …")
            case .empty:
                ContentUnavailableView("Keine Spiele gefunden", systemImage: "magnifyingglass", description: Text("Versuche einen anderen Spielnamen."))
            case .error:
                Text(search.errorMessage ?? "Suche fehlgeschlagen.").foregroundStyle(.red)
                Button("Erneut versuchen") { submit() }.frame(minHeight: 44)
            case .results:
                Section("\(search.results.count) Ergebnisse") {
                    ForEach(search.results) { result in
                        Button { onSelect(result) } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Label(result.name, systemImage: selectedIDs.contains(result.bggId) ? "checkmark.circle.fill" : "plus.circle").foregroundStyle(ClubTheme.ink)
                                if let year = result.yearPublished { Text(String(year)).font(.subheadline).foregroundStyle(.secondary) }
                            }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        }
                    }
                }
            }
            Section { Link("Spieldaten von BoardGameGeek", destination: URL(string: "https://boardgamegeek.com")!).font(.footnote) }
        }
        .scrollContentBackground(.hidden).background(ClubTheme.background)
        .onDisappear { search.reset() }
    }

    private func submit() {
        Task { await search.search(query) { try await RemoteDataSource.shared.bggSearch(query: $0) } }
    }
}
