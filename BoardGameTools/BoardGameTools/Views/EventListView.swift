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
                    .listRowBackground(Theme.cardBackground)
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Events")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isShowingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Theme.primaryGradient)
                    }
                }
            }
            .sheet(isPresented: $isShowingAddSheet) {
                EventEditView(existingEvent: nil)
                    .presentationDetents([.large])
            }
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localEvents.isEmpty {
                    LoadingOverlay(message: "Lade Events...")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if localEvents.isEmpty && !syncEngine.isSyncing {
                    EmptyStateView(icon: "calendar.badge.sparkles", title: "Noch keine Events", subtitle: "Plane deinen nächsten Spieleabend.")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct EventRow: View {
    let event: LocalEvent

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Theme.roseGradient
                Image("EventIcon")
                    .resizable()
                    .scaledToFit()
                    .padding(12)
            }
            .frame(width: 56, height: 56)
            .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .lineLimit(1)

                Text(event.eventDate.formattedISO8601() ?? event.eventDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                EventStatusBadge(status: event.status)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

struct EventStatusBadge: View {
    let status: String

    var body: some View {
        let (text, color) = statusAttributes

        Text(text)
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(.capsule)
    }

    private var statusAttributes: (String, Color) {
        switch status.lowercased() {
        case "planned", "geplant":
            return ("Geplant", .cyan)
        case "open", "offen":
            return ("Offen", Theme.primary)
        case "closed", "geschlossen", "abgeschlossen":
            return ("Geschlossen", .gray)
        default:
            return (status.capitalized, Theme.secondary)
        }
    }
}
