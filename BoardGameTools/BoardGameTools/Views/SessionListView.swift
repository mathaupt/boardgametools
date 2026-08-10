import SwiftUI
import SwiftData

struct SessionListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalSession.playedAt, order: .reverse) private var localSessions: [LocalSession]
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

                ForEach(localSessions) { session in
                    NavigationLink(destination: SessionDetailView(session: session.toDTO())) {
                        SessionRow(session: session)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Theme.cardBackground)
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Sessions")
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
                SessionEditView(existingSession: nil)
                    .presentationDetents([.large])
            }
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localSessions.isEmpty {
                    LoadingOverlay(message: "Lade Sessions...")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if localSessions.isEmpty && !syncEngine.isSyncing {
                    EmptyStateView(icon: "calendar.badge.clock", title: "Noch keine Sessions", subtitle: "Starte deine erste Spielsession.")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct SessionRow: View {
    let session: LocalSession

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Theme.warmGradient
                    .overlay(
                        Image(systemName: "dice.gamedots")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.8))
                    )
            }
            .frame(width: 56, height: 56)
            .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(session.playedAt.formattedISO8601() ?? session.playedAt)
                    .font(.headline)
                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                    Text("\(session.players?.count ?? 0) Spieler")
                    if let duration = session.durationMinutes {
                        Text("·")
                        Image(systemName: "clock")
                        Text("\(duration) min")
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}
