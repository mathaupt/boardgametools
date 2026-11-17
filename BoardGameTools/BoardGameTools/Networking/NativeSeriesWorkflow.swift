import Foundation
import Observation

struct NativeSeriesEntryInput: Encodable, Sendable {
    var gameId: String?
    var bggId: String?
    var kind: String?
    var reason: String?
}
struct NativeSeriesSelection: Identifiable, Sendable {
    let name: String
    let input: NativeSeriesEntryInput
    var id: String { input.gameId.map { "game:\($0)" } ?? "bgg:\(input.bggId ?? "")" }
}
@Observable @MainActor final class NativeSeriesAddWorkflow {
    private(set) var busy = false
    private(set) var canClose = false
    private(set) var errorMessage: String?
    private(set) var completed = 0
    func add(_ selections: [NativeSeriesSelection], perform: (NativeSeriesEntryInput) async throws -> Void,
             reload: () async throws -> [SeriesEntryDTO]) async {
        guard !busy else { return }
        busy = true
        canClose = false
        completed = 0
        errorMessage = nil
        defer { busy = false }
        do {
            for selection in selections {
                do { try await perform(selection.input) }
                catch APIError.conflict { /* Only a verified reload can resolve this conflict. */ }
                let entries = try await reload()
                guard entries.contains(where: { entry in
                    if let gameID = selection.input.gameId { return entry.collectionGameId == gameID || entry.gameId == gameID }
                    return entry.bggId == selection.input.bggId && selection.input.bggId != nil
                }) else { throw APIError.badRequest("Das Spiel ist nach dem Nachladen nicht in der Reihe. Bitte prüfe die Auswahl und versuche es erneut.") }
                completed += 1
            }
            canClose = !selections.isEmpty
        } catch { errorMessage = NativeRules.errorMessage(error) }
    }
}
