import SwiftUI
import SwiftData

struct EventEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine
    @Query(sort: \LocalGroup.name) private var localGroups: [LocalGroup]

    let existingEvent: EventDTO?

    @State private var title = ""
    @State private var description = ""
    @State private var eventDate = Date()
    @State private var location = ""
    @State private var selectedGroupId: String = ""
    @State private var inviteEmails = ""
    @State private var status: String = "planned"
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var isValid: Bool {
        !title.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Titel", text: $title)
                    TextField("Beschreibung", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    DatePicker("Datum", selection: $eventDate)
                    TextField("Ort", text: $location)
                }

                Section("Gruppe") {
                    Picker("Gruppe (optional)", selection: $selectedGroupId) {
                        Text("Keine").tag("")
                        ForEach(localGroups) { group in
                            Text(group.name).tag(group.id)
                        }
                    }
                }

                Section("Einladungen") {
                    TextField("E-Mails (kommasepariert)", text: $inviteEmails)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }

                if existingEvent != nil {
                    Section("Status") {
                        Picker("Status", selection: $status) {
                            Text("Geplant").tag("planned")
                            Text("Offen").tag("open")
                            Text("Geschlossen").tag("closed")
                        }
                        .pickerStyle(.segmented)
                    }
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(existingEvent == nil ? "Event erstellen" : "Event bearbeiten")
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
                if let event = existingEvent {
                    title = event.title
                    description = event.description ?? ""
                    eventDate = event.eventDate.iso8601Date() ?? Date()
                    location = event.location ?? ""
                    selectedGroupId = event.groupId ?? ""
                    status = event.status
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            let emailList = inviteEmails.isEmpty ? nil : inviteEmails
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }

            let input = EventInput(
                title: title,
                description: description.isEmpty ? nil : description,
                eventDate: eventDate.iso8601String(),
                location: location.isEmpty ? nil : location,
                groupId: selectedGroupId.isEmpty ? nil : selectedGroupId,
                inviteEmails: emailList
            )

            if let existingEvent = existingEvent {
                _ = try await RemoteDataSource.shared.updateEvent(id: existingEvent.id, input)
            } else {
                _ = try await RemoteDataSource.shared.createEvent(input)
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
