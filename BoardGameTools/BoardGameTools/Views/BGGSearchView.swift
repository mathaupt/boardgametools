import SwiftUI

struct BGGSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine

    @State private var query = ""
    @State private var results: [BGGSearchResult] = []
    @State private var isSearching = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    TextField("Spielname suchen...", text: $query)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            Task { await search() }
                        }

                    Button {
                        Task { await search() }
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(Theme.primaryGradient)
                            .clipShape(.circle)
                    }
                    .disabled(query.count < 2 || isSearching)
                }
                .padding()

                if isSearching && results.isEmpty {
                    Spacer()
                    LoadingOverlay(message: "Suche auf BGG...")
                    Spacer()
                } else if let errorMessage = errorMessage {
                    Spacer()
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                    Spacer()
                } else if results.isEmpty {
                    Spacer()
                    EmptyStateView(icon: "magnifyingglass", title: "BGG durchsuchen", subtitle: "Gib mindestens 2 Zeichen ein, um ein Spiel bei BoardGameGeek zu finden.")
                    Spacer()
                } else {
                    List(results) { result in
                        Button {
                            Task { await importGame(bggId: result.bggId) }
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(result.name)
                                        .font(.headline)
                                        .foregroundStyle(.primary)
                                    if let year = result.yearPublished {
                                        Text("\(year)")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                Spacer()
                                if isSearching {
                                    ProgressView()
                                } else {
                                    Image(systemName: "plus.circle.fill")
                                        .font(.title3)
                                        .foregroundStyle(Theme.primaryGradient)
                                }
                            }
                        }
                        .listRowBackground(Theme.cardBackground)
                    }
                    .listStyle(.plain)
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("BGG-Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fertig") { dismiss() }
                }
            }
        }
    }

    private func search() async {
        guard query.count >= 2 else { return }
        isSearching = true
        errorMessage = nil
        do {
            results = try await RemoteDataSource.shared.bggSearch(query: query)
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isSearching = false
    }

    private func importGame(bggId: String) async {
        isSearching = true
        errorMessage = nil
        do {
            _ = try await RemoteDataSource.shared.bggImport(bggId: bggId)
            await syncEngine.sync()
            dismiss()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isSearching = false
    }
}
