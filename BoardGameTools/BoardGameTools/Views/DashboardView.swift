import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Environment(\.dynamicTypeSize) private var typeSize
    @Query private var games: [LocalGame]
    @Query private var sessions: [LocalSession]
    @Query private var events: [LocalEvent]
    @State private var activeSheet: DashboardSheet?

    private enum DashboardSheet: String, Identifiable {
        case session, game, event
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    if !networkMonitor.isOnline { OfflineBanner() }
                    TimelineView(.periodic(from: .now, by: 60)) { timeline in
                        nextEvening(now: timeline.date)
                    }
                    quickActions
                    history
                    syncStatus
                }
                .padding(20)
                .frame(maxWidth: 720)
                .frame(maxWidth: .infinity)
            }
            .background(ClubTheme.background.ignoresSafeArea())
            .foregroundStyle(ClubTheme.ink)
            .navigationTitle("Übersicht")
            .sheet(item: $activeSheet) { sheet in
                switch sheet {
                case .session: SessionEditView(existingSession: nil)
                case .game: GameAddSheet()
                case .event: EventEditView(existingEvent: nil)
                }
            }
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
        }
    }

    @ViewBuilder
    private func nextEvening(now: Date) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeading("Dein nächster Spieleabend")
            if let event = ClubContent.nextEvent(in: events.map { $0.toDTO() }, now: now) {
                NextEveningCard(event: event)
            } else if syncEngine.isSyncing && events.isEmpty {
                ProgressView("Spieleabende werden geladen …")
                    .frame(maxWidth: .infinity, minHeight: 140)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Zeit für die nächste Runde")
                        .font(.title2.bold())
                    Text("Plane einen Spieleabend und wählt eure Spiele gemeinsam aus.")
                        .foregroundStyle(ClubTheme.secondaryInk)
                    Button("Spieleabend planen") { activeSheet = .event }
                        .buttonStyle(ClubTheme.PrimaryButton())
                }
                .modifier(ClubTheme.Surface())
            }
        }
    }

    private var quickActions: some View {
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 12))
            : AnyLayout(HStackLayout(spacing: 12))
        return layout {
            Button { activeSheet = .session } label: {
                Label("Partie erfassen", systemImage: "plus")
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .padding(8)
            }
            Button { activeSheet = .game } label: {
                Label("Spiel hinzufügen", systemImage: "dice")
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .padding(8)
            }
        }
        .font(.subheadline.weight(.semibold))
        .buttonStyle(.bordered)
        .tint(ClubTheme.tint)
    }

    private var history: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeading("Zuletzt gespielt")
            let recent = ClubContent.recentSessions(in: sessions.map { $0.toDTO() })
            if recent.isEmpty {
                Text("Noch keine Partien erfasst. Halte nach dem Spielen eure Ergebnisse fest.")
                    .foregroundStyle(ClubTheme.secondaryInk)
            } else {
                VStack(spacing: 0) {
                    ForEach(recent) { session in
                        NavigationLink(destination: SessionDetailView(session: session)) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(games.first { $0.id == session.gameId }?.name ?? "Spielsession")
                                    .font(.headline)
                                    .foregroundStyle(ClubTheme.ink)
                                if let date = ClubContent.date(session.playedAt) {
                                    Text(date, format: .dateTime.day().month(.wide).year())
                                        .font(.subheadline)
                                        .foregroundStyle(ClubTheme.secondaryInk)
                                }
                                Text(sessionSummary(session))
                                    .font(.subheadline)
                                    .foregroundStyle(ClubTheme.secondaryInk)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 16)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        if session.id != recent.last?.id { Divider() }
                    }
                }
                NavigationLink("Alle Spielsessions", destination: SessionListView())
                    .frame(minHeight: 44)
            }
        }
    }

    private var syncStatus: some View {
        VStack(alignment: .leading, spacing: 12) {
            if syncEngine.isSyncing {
                ProgressView("Synchronisiere …")
            } else if let date = syncEngine.lastSyncedAt.flatMap(ClubContent.date) {
                Label("Synchronisiert: \(date.formatted(date: .abbreviated, time: .shortened))", systemImage: "checkmark.circle")
                    .font(.footnote)
                    .foregroundStyle(ClubTheme.secondaryInk)
            }
            if let error = syncEngine.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle")
                    .font(.subheadline)
                Button("Erneut synchronisieren") { Task { await syncEngine.sync() } }
                    .frame(minHeight: 44)
            }
        }
    }

    private func sectionHeading(_ title: String) -> some View {
        Text(title).font(.title3.bold()).accessibilityAddTraits(.isHeader)
    }

    private func sessionSummary(_ session: SessionDTO) -> String {
        let players = "\(session.players.count) Personen"
        return session.durationMinutes.map { "\(players) · \($0) Min." } ?? players
    }
}

struct NextEveningCard: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    let event: EventDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            let layout = typeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: 14))
                : AnyLayout(HStackLayout(alignment: .top, spacing: 16))
            layout {
                EventDateBlock(value: event.eventDate)
                VStack(alignment: .leading, spacing: 8) {
                    Text(event.title).font(.title2.bold()).fixedSize(horizontal: false, vertical: true)
                    if let date = ClubContent.date(event.eventDate) {
                        Text(date, format: .dateTime.weekday(.wide).hour().minute())
                            .font(.subheadline)
                            .foregroundStyle(ClubTheme.secondaryInk)
                    }
                    if let location = event.location, !location.isEmpty {
                        Label(location, systemImage: "mappin.and.ellipse")
                            .font(.subheadline)
                            .foregroundStyle(ClubTheme.secondaryInk)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            EventStatusBadge(status: event.status)
            NavigationLink(destination: EventDetailView(event: event)) {
                Text("Spieleabend ansehen")
            }
            .buttonStyle(ClubTheme.PrimaryButton())
        }
        .modifier(ClubTheme.Surface())
    }
}

struct OfflineBanner: View {
    var body: some View {
        Label("Offline · Gespeicherte Daten werden angezeigt.", systemImage: "wifi.slash")
            .font(.subheadline)
            .foregroundStyle(.primary)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(ClubTheme.softBlue, in: .rect(cornerRadius: 12))
    }
}
