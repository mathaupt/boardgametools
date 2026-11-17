import SwiftUI
import SwiftData

struct AddSeriesEntrySheet: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(\.dismiss) private var dismiss
    let series: LocalGameSeries
    @Query(sort: \LocalGame.name) private var localGames: [LocalGame]
    @State private var query = ""
    @State private var selected: [NativeSeriesSelection] = []
    @State private var showingBGG = false
    @State private var workflow = NativeSeriesAddWorkflow()
    @State private var syncError: String?

    private var available: [GameDTO] {
        NativeRules.matchingGames(localGames.map { $0.toDTO() }, query: query).filter { game in
            !(series.entries ?? []).contains { $0.gameId == game.id || (game.bggId != nil && $0.bggId == game.bggId) }
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Sammlung durchsuchen", text: $query)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityLabel("Sammlung durchsuchen")
                        .frame(minHeight: 44)
                }
                if let error = workflow.errorMessage ?? syncError {
                    Section { Text(error).foregroundStyle(.red) }
                }
                if workflow.busy { ProgressView("\(workflow.completed) von \(selected.count) Spielen geprüft") }
                Section {
                    Button("Auf BoardGameGeek suchen", systemImage: "magnifyingglass") { showingBGG = true }
                        .frame(minHeight: 44)
                }
                if !selected.isEmpty {
                    Section("Ausgewählt: \(selected.count)") {
                        ForEach(selected) { selection in
                            Button { toggle(selection) } label: {
                                Label("\(selection.name) · \(selection.input.kind == "temporary" ? "Nur Reihe" : "Sammlung")", systemImage: "checkmark.circle.fill")
                                    .frame(minHeight: 44)
                            }
                        }
                    }
                }
                Section("Aus deiner Sammlung") {
                    if available.isEmpty {
                        Text(localGames.isEmpty ? "Noch keine Spiele in deiner Sammlung." : "Keine weiteren passenden Spiele gefunden.").foregroundStyle(.secondary)
                    }
                    ForEach(available) { game in
                        let selection = NativeSeriesSelection(name: game.name, input: NativeSeriesEntryInput(gameId: game.id, bggId: nil, kind: "collection", reason: nil))
                        Button { toggle(selection) } label: {
                            HStack(spacing: 12) {
                                GameCover(imageUrl: game.imageUrl, name: game.name).frame(width: 44, height: 56)
                                Text(game.name).foregroundStyle(ClubTheme.ink)
                                Spacer(minLength: 0)
                                Image(systemName: selected.contains(where: { $0.id == selection.id }) ? "checkmark.circle.fill" : "circle")
                            }.frame(minHeight: 44).contentShape(.rect)
                        }.accessibilityLabel("\(game.name) auswählen")
                    }
                }
            }
            .disabled(workflow.busy)
            .scrollContentBackground(.hidden).background(ClubTheme.background)
            .navigationTitle("Spiele zur Reihe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() }.disabled(workflow.busy) }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Hinzufügen (\(selected.count))") { Task { await add() } }
                        .disabled(selected.isEmpty || workflow.busy)
                }
            }
            .interactiveDismissDisabled(workflow.busy)
            .sheet(isPresented: $showingBGG) {
                SeriesBGGSelectionSheet(existing: series.entries ?? [], selections: $selected)
            }
        }.tint(ClubTheme.tint)
    }

    private func toggle(_ selection: NativeSeriesSelection) {
        if let index = selected.firstIndex(where: { $0.id == selection.id }) { selected.remove(at: index) }
        else if selected.count < 50 { selected.append(selection) }
    }

    private func add() async {
        syncError = nil
        await workflow.add(selected, perform: { input in
            try await RemoteDataSource.shared.addSeriesSelection(seriesID: series.id, input: input)
        }, reload: { try await RemoteDataSource.shared.series(id: series.id).entries })
        guard workflow.canClose else { return }
        await syncEngine.sync()
        guard syncEngine.errorMessage == nil else {
            syncError = "Die Reihe wurde geändert, konnte aber noch nicht synchronisiert werden. Bitte versuche es erneut."
            return
        }
        dismiss()
    }
}

struct SeriesBGGSelectionSheet: View {
    @Environment(\.dismiss) private var dismiss
    let existing: [LocalGameSeriesEntry]
    @Binding var selections: [NativeSeriesSelection]
    @State private var kind = "collection"
    @State private var reason = "BORROWED"
    @State private var notice: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Verwendung", selection: $kind) {
                    Text("Auch in Sammlung").tag("collection")
                    Text("Nur in dieser Reihe").tag("temporary")
                }.pickerStyle(.menu).padding(.horizontal)
                if kind == "temporary" {
                    Picker("Herkunft", selection: $reason) {
                        Text("Geliehen").tag("BORROWED")
                        Text("Mitgebracht").tag("BROUGHT_BY_SOMEONE")
                        Text("Nicht mehr im Besitz").tag("NO_LONGER_OWNED")
                        Text("Andere Herkunft").tag("OTHER")
                    }.pickerStyle(.menu)
                }
                Text(kind == "temporary" ? "Das Spiel bleibt außerhalb deiner Sammlung." : "Vorhandene Spiele werden verwendet, neue Spiele in die Sammlung importiert.")
                    .font(.subheadline).foregroundStyle(.secondary).padding(.horizontal)
                if let notice { Text(notice).font(.subheadline).padding(.horizontal) }
                BGGSearchPanel(onSelect: { result in
                    guard !existing.contains(where: { $0.bggId == result.bggId }) else { notice = "Dieses Spiel ist bereits in der Reihe."; return }
                    let input = NativeSeriesEntryInput(gameId: nil, bggId: result.bggId, kind: kind, reason: kind == "temporary" ? reason : nil)
                    let selection = NativeSeriesSelection(name: result.name, input: input)
                    if let index = selections.firstIndex(where: { $0.id == selection.id }) { selections.remove(at: index) }
                    else if selections.count < 50 { selections.append(selection) }
                    notice = "\(selections.count) Spiele ausgewählt."
                }, selectedIDs: Set(selections.compactMap { $0.input.bggId }))
            }
            .navigationTitle("BGG-Spiele auswählen").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fertig") { dismiss() } } }
        }.tint(ClubTheme.tint)
    }
}
