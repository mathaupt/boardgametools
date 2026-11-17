import Foundation
import Observation

enum NativeSearchState { case idle, loading, results, empty, error }
@Observable @MainActor final class NativeBGGSearch {
    private(set) var state: NativeSearchState = .idle
    private(set) var results: [BGGSearchResult] = []
    private(set) var errorMessage: String?
    private var generation = 0
    private var activeQuery: String?

    func reset() {
        generation += 1
        activeQuery = nil
        state = .idle
        results = []
        errorMessage = nil
    }

    func search(_ query: String, using load: (String) async throws -> [BGGSearchResult]) async {
        let query = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (2...200).contains(query.count), query != activeQuery else { return }
        generation += 1
        let request = generation
        activeQuery = query
        state = .loading
        results = []
        errorMessage = nil
        defer { if generation == request { activeQuery = nil } }
        do {
            let response = try await load(query)
            guard generation == request, !Task.isCancelled else { return }
            results = response
            state = response.isEmpty ? .empty : .results
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            errorMessage = (error as? APIError)?.message ?? "BoardGameGeek ist gerade nicht erreichbar. Bitte versuche es erneut."
            state = .error
        }
    }
}
