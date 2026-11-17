import SwiftUI

struct BGGImportSheet: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(\.dismiss) private var dismiss
    let result: BGGSearchResult
    let onImported: () -> Void
    @State private var versions: [BGGVersionDTO] = []
    @State private var versionID = ""
    @State private var existing: BGGCollectionMatch?
    @State private var ready = false
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section { Text(result.name).font(.title2.bold()) }
                if let existing {
                    Section { Label("Bereits in deiner Sammlung: \(existing.name)", systemImage: "checkmark.circle") }
                } else if ready {
                    Section("Ausgabe") {
                        Picker("Deutsche Ausgabe", selection: $versionID) {
                            Text("BGG-Hauptspiel").tag("")
                            ForEach(versions) { version in
                                Text("\(version.name)\(version.yearPublished.map { " · \($0)" } ?? "")").tag(version.id)
                            }
                        }
                        if versions.isEmpty { Text("Keine deutsche Ausgabe verfügbar. Du kannst das Hauptspiel importieren.").foregroundStyle(.secondary) }
                    }
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage).foregroundStyle(.red)
                        Button("Erneut prüfen") { Task { await load() } }.disabled(busy).frame(minHeight: 44)
                    }
                }
                if busy { ProgressView("Wird bearbeitet …") }
                if ready && existing == nil {
                    Button("In meine Sammlung importieren") { Task { await importGame() } }
                        .frame(minHeight: 44).disabled(busy)
                }
            }
            .navigationTitle("Spiel importieren").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Schließen") { dismiss() }.disabled(busy) } }
            .task { await load() }
            .interactiveDismissDisabled(busy)
        }.tint(ClubTheme.tint)
    }

    private func load() async {
        guard !busy else { return }
        busy = true
        ready = false
        errorMessage = nil
        defer { busy = false }
        do {
            async let presence = RemoteDataSource.shared.bggPresence(ids: [result.bggId])
            async let editions = RemoteDataSource.shared.bggVersions(id: result.bggId)
            let (matches, loaded) = try await (presence, editions)
            existing = matches[result.bggId] ?? nil
            versions = loaded
            ready = true
        } catch { errorMessage = NativeRules.errorMessage(error) }
    }

    private func importGame() async {
        guard ready, !busy, existing == nil else { return }
        busy = true
        defer { busy = false }
        do {
            _ = try await RemoteDataSource.shared.bggImport(bggId: result.bggId, versionId: versionID.isEmpty ? nil : versionID)
            await syncEngine.sync()
            guard syncEngine.errorMessage == nil else {
                errorMessage = "Das Spiel wurde importiert. Die Sammlung konnte noch nicht aktualisiert werden. Schließe die Ansicht und lade die Sammlung erneut."
                ready = false
                return
            }
            onImported()
        } catch { errorMessage = NativeRules.errorMessage(error) }
    }
}
