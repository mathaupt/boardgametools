import SwiftUI

struct EventDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    let event: EventDTO

    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 16) {
                    ZStack {
                        Theme.roseGradient
                            .overlay(
                                Image(systemName: "calendar.badge.sparkles")
                                    .font(.title2)
                                    .foregroundStyle(.white.opacity(0.8))
                            )
                    }
                    .frame(width: 64, height: 64)
                    .clipShape(.rect(cornerRadius: 16))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        EventStatusBadge(status: event.status)
                    }
                }

                if let description = event.description, !description.isEmpty {
                    Text(description)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Label(event.eventDate.formattedISO8601() ?? event.eventDate, systemImage: "calendar")
                    if let location = event.location, !location.isEmpty {
                        Label(location, systemImage: "mappin.and.ellipse")
                    }
                    if let groupId = event.groupId {
                        Label("Gruppe: \(groupId)", systemImage: "person.3")
                    }
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    Button("Bearbeiten") {
                        isEditing = true
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.primary)

                    Button("Löschen") {
                        isDeleting = true
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                }

                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .padding()
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Event")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isEditing) {
            EventEditView(existingEvent: event)
        }
        .alert("Event löschen?", isPresented: $isDeleting) {
            Button("Abbrechen", role: .cancel) {}
            Button("Löschen", role: .destructive) {
                Task { await deleteEvent() }
            }
        } message: {
            Text("Dieses Event wird unwiderruflich entfernt.")
        }
    }

    private func deleteEvent() async {
        do {
            try await RemoteDataSource.shared.deleteEvent(id: event.id)
            await syncEngine.sync()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
