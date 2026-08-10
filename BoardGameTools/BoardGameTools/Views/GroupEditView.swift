import SwiftUI

struct GroupEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine

    let existingGroup: GroupDTO?

    @State private var name = ""
    @State private var description = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var isValid: Bool {
        !name.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name & Beschreibung") {
                    TextField("Name", text: $name)
                    TextField("Beschreibung", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(existingGroup == nil ? "Gruppe erstellen" : "Gruppe bearbeiten")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                }
            }
            .task {
                if let group = existingGroup {
                    name = group.name
                    description = group.description ?? ""
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            let input = GroupInput(
                name: name,
                description: description.isEmpty ? nil : description
            )

            if let existingGroup = existingGroup {
                _ = try await RemoteDataSource.shared.updateGroup(id: existingGroup.id, input)
            } else {
                _ = try await RemoteDataSource.shared.createGroup(input)
            }

            await syncEngine.sync()
            dismiss()
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
