import SwiftUI
import SwiftData

struct GroupListView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(NetworkMonitor.self) private var networkMonitor
    @Query(sort: \LocalGroup.name) private var localGroups: [LocalGroup]
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

                ForEach(localGroups) { group in
                    NavigationLink(destination: GroupDetailView(group: group.toDTO())) {
                        GroupRow(group: group)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Theme.cardBackground)
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Gruppen")
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
                GroupEditView(existingGroup: nil)
                    .presentationDetents([.large])
            }
            .task { await syncEngine.sync() }
            .refreshable { await syncEngine.sync() }
            .overlay {
                if syncEngine.isSyncing && localGroups.isEmpty {
                    LoadingOverlay(message: "Lade Gruppen...")
                } else if let errorMessage = errorMessage {
                    EmptyStateView(icon: "exclamationmark.triangle", title: "Fehler", subtitle: errorMessage)
                } else if localGroups.isEmpty && !syncEngine.isSyncing {
                    EmptyStateView(icon: "person.3", title: "Noch keine Gruppen", subtitle: "Erstelle eine Gruppe für deine Spielrunde.")
                }
            }
            .onChange(of: syncEngine.errorMessage) { _, new in
                errorMessage = new
            }
        }
    }
}

struct GroupRow: View {
    let group: LocalGroup

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Theme.coolGradient
                    .overlay(
                        Image(systemName: "person.3.fill")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.8))
                    )
            }
            .frame(width: 56, height: 56)
            .clipShape(.rect(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(group.name)
                    .font(.headline)
                    .lineLimit(1)

                if let desc = group.desc, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                    Text("\(group.members?.count ?? 0) Mitglieder")
                }
                .font(.caption2)
                .foregroundStyle(.tertiary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}
