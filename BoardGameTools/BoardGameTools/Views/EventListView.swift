import SwiftUI
import SwiftData

struct EventListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalEvent.eventDate) private var localEvents: [LocalEvent]
    @State private var errorMessage: String?
    @State private var isShowingAddSheet = false

    var body: some View {
        NavigationStack {
            List {
                if !networkMonitor.isOnline {
                    OfflineBanner()
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }

                ForEach(localEvents) { event in
                    NavigationLink(destination: EventDetailView(event: event.toDTO())) {
                        EventRow(event: event)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(ClubTheme.surface)
                    .listRowSeparator(.visible)
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(ClubTheme.background.ignoresSafeArea())
            .navigationTitle("Spieleabende")
            .tint(ClubTheme.tint)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Label("Spieleabend planen", systemImage: "plus")
                            .labelStyle(.iconOnly)
                            .frame(minWidth: 44, minHeight: 44)
                    }
                }
            }
            .sheet(isPresented: $isShowingAddSheet) {
                EventEditView(existingEvent: nil)
                    .presentationDetents([.large])
            }
            .onAppear { Task { await syncEngine.sync() } }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localEvents.isEmpty {
                    LoadingOverlay(message: "Lade Spieleabende …")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if localEvents.isEmpty && !syncEngine.isSyncing {
                    ContentUnavailableView {
                        Label("Die nächste Runde wartet", systemImage: "calendar")
                    } description: {
                        Text("Plane einen Spieleabend und wählt eure Spiele gemeinsam aus.")
                    } actions: {
                        Button("Spieleabend planen") { isShowingAddSheet = true }
                            .buttonStyle(.borderedProminent)
                    }
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct EventRow: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    let event: LocalEvent

    var body: some View {
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12))
            : AnyLayout(HStackLayout(alignment: .top, spacing: 16))
        layout {
            EventDateBlock(value: event.eventDate)
            VStack(alignment: .leading, spacing: 8) {
                Text(event.title)
                    .font(.headline)
                    .foregroundStyle(ClubTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let date = ClubContent.date(event.eventDate) {
                    Text(date, format: .dateTime.weekday(.abbreviated).hour().minute())
                        .font(.subheadline)
                        .foregroundStyle(ClubTheme.secondaryInk)
                } else {
                    Text("Termin noch nicht verfügbar")
                        .font(.subheadline)
                        .foregroundStyle(ClubTheme.secondaryInk)
                }
                if let location = event.location, !location.isEmpty {
                    Label(location, systemImage: "mappin.and.ellipse")
                        .font(.subheadline)
                        .foregroundStyle(ClubTheme.secondaryInk)
                }
                EventStatusBadge(status: event.status)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .combine)
    }
}

struct EventDateBlock: View {
    let value: String
    @ScaledMetric(relativeTo: .body) private var width = 66

    var body: some View {
        Group {
            if let date = ClubContent.date(value) {
                VStack(spacing: 2) {
                    Text(date, format: .dateTime.day())
                        .font(.largeTitle.bold())
                        .monospacedDigit()
                    Text(date, format: .dateTime.month(.abbreviated))
                        .font(.caption.weight(.semibold))
                    Text(date, format: .dateTime.year())
                        .font(.caption2)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(date.formatted(date: .complete, time: .omitted))
            } else {
                Image(systemName: "calendar")
                    .font(.title)
                    .accessibilityLabel("Termin unbekannt")
            }
        }
        .frame(minWidth: width, minHeight: 82)
        .padding(.vertical, 8)
        .foregroundStyle(ClubTheme.dateInk)
        .background(ClubTheme.dateBackground, in: .rect(cornerRadius: 10))
    }
}

struct EventStatusBadge: View {
    let status: String

    var body: some View {
        Text(title)
            .font(.footnote.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .foregroundStyle(ClubTheme.tint)
            .background(ClubTheme.softBlue, in: .rect(cornerRadius: 6))
            .fixedSize(horizontal: false, vertical: true)
    }

    private var title: String {
        switch status.lowercased() {
        case "planned", "geplant": "Geplant"
        case "open", "offen": "Abstimmung offen"
        case "closed", "geschlossen", "abgeschlossen": "Abstimmung geschlossen"
        default: status.capitalized
        }
    }
}
