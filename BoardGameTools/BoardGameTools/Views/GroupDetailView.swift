import SwiftUI

struct GroupDetailView: View {
    @Environment(SyncEngine.self) private var syncEngine
    let group: GroupDTO

    @State private var isEditing = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 16) {
                    ZStack {
                        Theme.coolGradient
                            .overlay(
                                Image(systemName: "person.3.fill")
                                    .font(.title2)
                                    .foregroundStyle(.white.opacity(0.8))
                            )
                    }
                    .frame(width: 64, height: 64)
                    .clipShape(.rect(cornerRadius: 16))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(group.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("\(group.members?.count ?? 0) Mitglieder")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                if let description = group.description, !description.isEmpty {
                    Text(description)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

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
        .navigationTitle("Gruppe")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isEditing) {
            GroupEditView(existingGroup: group)
        }
        .alert("Gruppe löschen?", isPresented: $isDeleting) {
            Button("Abbrechen", role: .cancel) {}
            Button("Löschen", role: .destructive) {
                Task { await deleteGroup() }
            }
        } message: {
            Text("Diese Gruppe wird unwiderruflich entfernt.")
        }
    }

    private func deleteGroup() async {
        do {
            try await RemoteDataSource.shared.deleteGroup(id: group.id)
            await syncEngine.sync()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
