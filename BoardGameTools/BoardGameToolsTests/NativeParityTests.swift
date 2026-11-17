import Foundation
import SwiftData
#if !CONTRACT_TEST_RUNNER
@testable import BoardGameTools
#endif

@MainActor
func checkBGGSearchStates() async throws {
    let search = NativeBGGSearch()
    await search.search("  Azul  ") { query in
        try require(query == "Azul", "BGG query not trimmed")
        return []
    }
    try require(search.state == .empty, "empty search must not show initial state")
    await search.search("Fehler") { _ in throw APIError.serverError(503) }
    try require(search.state == .error, "search errors need retry state")
    var continuation: CheckedContinuation<[BGGSearchResult], Never>?
    let older = Task { await search.search("Alt") { _ in await withCheckedContinuation { continuation = $0 } } }
    while continuation == nil { await Task.yield() }
    await search.search("Neu") { _ in [] }
    continuation?.resume(returning: [BGGSearchResult(bggId: "13", name: "Alt", yearPublished: nil)])
    await older.value
    try require(search.state == .empty && search.results.isEmpty, "stale BGG response replaced current results")
    search.reset()
    try require(search.state == .idle, "reset must restore initial state")
    print("PASS: BGG empty, error, retry and stale response states")
}

func checkNativeRules() throws {
    try require(NativeRules.votesLabel(1) == "1 Stimme", "singular vote label")
    try require(NativeRules.votesLabel(3) == "3 Stimmen", "plural vote label")
    let games = try JSONDecoder().decode([GameDTO].self, from: Data(#"[{"id":"z","name":"Öl 10","minPlayers":2,"maxPlayers":4,"createdAt":"now","updatedAt":"now"},{"id":"a","name":"Öl 2","minPlayers":2,"maxPlayers":4,"createdAt":"now","updatedAt":"now"}]"#.utf8))
    try require(NativeRules.matchingGames(games, query: "  ol 2 ").map(\.id) == ["a"], "game search must trim and fold accents")
    try require(NativeRules.matchingGames([], query: "a").isEmpty, "empty games")
    let proposals = try JSONDecoder().decode([EventProposalDTO].self, from: Data(#"[{"id":"z","eventId":"e","bggName":"Zug 10","proposedById":"other","voteCount":3,"createdAt":"2026-11-02T12:00:00Z"},{"id":"a","eventId":"e","bggName":"Zug 2","proposedById":"me","voteCount":3,"createdAt":"2026-11-01T12:00:00Z"}]"#.utf8))
    try require(NativeRules.sortedProposals(proposals, order: .votes).map(\.id) == ["a", "z"], "vote ties require stable age order")
    try require(NativeRules.sortedProposals(proposals, order: .name).map(\.id) == ["a", "z"], "natural game name order")
    try require(NativeRules.sortedProposals(proposals, order: .newest).map(\.id) == ["z", "a"], "newest order")
    let event = try JSONDecoder().decode(EventDTO.self, from: Data(#"{"id":"e","title":"Abend","eventDate":"2026-12-01T12:00:00Z","status":"closed","isCreator":true,"currentUserId":"me","eventState":{"label":"Geschlossen","available":{"voteGame":false,"proposeGame":false}},"createdAt":"now","updatedAt":"now"}"#.utf8))
    try require(!NativeRules.canDelete(proposals[0], in: event), "host cannot delete after closure")
    var open = event
    open.eventState = NativeEventState(label: "Offen", available: ["voteGame":true,"proposeGame":true])
    try require(NativeRules.canDelete(proposals[0], in: open), "host can delete while open")
    open.isCreator = false
    try require(!NativeRules.canDelete(proposals[0], in: open), "participant cannot delete another proposal")
    try require(NativeRules.canDelete(proposals[1], in: open), "participant can delete own proposal")
    print("PASS: native search, stable sorting and server mutation permissions")
}

@MainActor
func checkNativeDetailContracts() throws {
    let payload = Data(#"{"id":"event","title":"Abend","eventDate":"2026-12-01T18:00:00Z","status":"open","isCreator":true,"currentUserId":"host","eventState":{"label":"Abstimmung offen","available":{"voteGame":true,"proposeGame":true}},"proposals":[{"id":"p","eventId":"event","gameId":"g","proposedById":"host","voteCount":3,"userHasVoted":true,"game":{"id":"g","name":"Azul","minPlayers":2,"maxPlayers":4,"createdAt":"now","updatedAt":"now"},"createdAt":"now"}],"createdAt":"now","updatedAt":"now"}"#.utf8)
    let event = try JSONDecoder().decode(EventDTO.self, from: payload)
    let encoded = try JSONSerialization.jsonObject(with: JSONEncoder().encode(event)) as! [String: Any]
    try require(encoded["isCreator"] as? Bool == true, "event host authorization lost")
    let proposals = encoded["proposals"] as! [[String: Any]]
    try require(proposals[0]["userHasVoted"] as? Bool == true, "own vote lost")
    try require((proposals[0]["game"] as? [String: Any])?["name"] as? String == "Azul", "proposal game details lost")
    let seriesPayload = Data(#"{"id":"entry","seriesId":"series","gameId":"temporary:entry","collectionGameId":null,"gameName":"EXIT","gameImageUrl":"https://example.com/exit.png","source":"TEMPORARY_BGG","bggId":"123","sortOrder":0,"played":false,"createdAt":"now","updatedAt":"now"}"#.utf8)
    let entry = try JSONDecoder().decode(SeriesEntryDTO.self, from: seriesPayload)
    let roundtrip = try JSONSerialization.jsonObject(with: JSONEncoder().encode(LocalGameSeriesEntry(dto: entry).toDTO())) as! [String: Any]
    try require(roundtrip["gameName"] as? String == "EXIT", "temporary series name lost")
    try require(roundtrip["source"] as? String == "TEMPORARY_BGG", "temporary series source lost")
    print("PASS: event host, vote, detail and temporary series contracts")
}

@MainActor
func checkSnapshotSessions() throws {
    let payload = Data(#"{"id":"snapshot","gameId":null,"gameNameSnapshot":"Azul","gameBggIdSnapshot":"230802","gameImageUrlSnapshot":"https://cf.geekdo-images.com/azul.png","gameMinPlayersSnapshot":2,"gameMaxPlayersSnapshot":4,"gamePlayTimeMinutesSnapshot":45,"gameComplexitySnapshot":2,"playedAt":"2026-11-16T12:00:00Z","players":[],"guestPlayers":[{"id":"guest","name":"Anna","score":42,"isWinner":true,"placement":1}],"createdAt":"now","updatedAt":"now"}"#.utf8)
    let dto = try JSONDecoder().decode(SessionDTO.self, from: payload)
    let persistence = PersistenceController(isStoredInMemoryOnly: true)
    let local = LocalSession(dto: dto)
    persistence.mainContext.insert(local)
    try persistence.mainContext.save()
    let saved = try persistence.mainContext.fetch(FetchDescriptor<LocalSession>()).first!
    let roundtrip = try JSONSerialization.jsonObject(with: JSONEncoder().encode(saved.toDTO())) as! [String: Any]
    let original = try JSONSerialization.jsonObject(with: payload) as! [String: Any]
    for key in ["gameNameSnapshot", "gameBggIdSnapshot", "gameImageUrlSnapshot", "gameMinPlayersSnapshot", "gameMaxPlayersSnapshot", "gamePlayTimeMinutesSnapshot", "gameComplexitySnapshot", "guestPlayers"] {
        try require(NSDictionary(dictionary: [key: roundtrip[key] as Any]).isEqual(to: [key: original[key] as Any]), "session roundtrip lost \(key)")
    }
    let legacy = try JSONDecoder().decode(SessionDTO.self, from: Data(#"{"id":"legacy","gameId":"g","playedAt":"now","players":[],"createdAt":"now","updatedAt":"now"}"#.utf8))
    saved.update(from: legacy)
    let updated = try JSONSerialization.jsonObject(with: JSONEncoder().encode(saved.toDTO())) as! [String: Any]
    try require(updated["gameNameSnapshot"] == nil, "stale snapshot survived update")
    print("PASS: snapshot session and guest SwiftData roundtrip, legacy response")
}


@MainActor
func checkSeriesWorkflow() async throws {
    let entry = try JSONDecoder().decode(SeriesEntryDTO.self, from: Data(#"{"id":"e","seriesId":"s","gameId":"temporary:e","bggId":"13","sortOrder":0,"played":false,"createdAt":"now","updatedAt":"now"}"#.utf8))
    let workflow = NativeSeriesAddWorkflow()
    let selection = NativeSeriesSelection(name: "EXIT", input: NativeSeriesEntryInput(gameId: nil, bggId: "13", kind: "temporary", reason: nil))
    await workflow.add([selection], perform: { _ in throw APIError.conflict }, reload: { [entry] })
    try require(workflow.canClose, "verified duplicate should finish selection")
    await workflow.add([selection], perform: { _ in throw APIError.conflict }, reload: { [] })
    try require(!workflow.canClose && workflow.errorMessage != nil, "unverified conflict must remain visible")
    await workflow.add([selection], perform: { _ in }, reload: { throw APIError.serverError(503) })
    try require(!workflow.canClose, "failed reload must keep dialog open")
    await workflow.add([selection], perform: { _ in throw URLError(.notConnectedToInternet) }, reload: { [] })
    try require(workflow.errorMessage?.contains("Verbindung") == true, "unknown network failure must have German recovery text")
    print("PASS: sequential series addition and verified duplicate reconciliation")
}
