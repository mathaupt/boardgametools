import SwiftUI

struct SeriesEditView: View {
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(\.dismiss) private var dismiss
    var series: LocalGameSeries?

    @State private var name = ""
    @State private var description = ""
    @State private var imageUrl = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var isEditing: Bool { series != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                        .accessibilityLabel("Name der Reihe")
                    TextField("Beschreibung", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                        .accessibilityLabel("Beschreibung")
                    TextField("Bild-URL (optional)", text: $imageUrl)
                        .accessibilityLabel("Bild-URL")
                        .autocapitalization(.none)
                        .keyboardType(.URL)
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "Reihe bearbeiten" : "Neue Reihe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Speichern") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
                }
            }
            .onAppear {
                if let series = series {
                    name = series.name
                    description = series.desc ?? ""
                    imageUrl = series.imageUrl ?? ""
                }
            }
            .overlay {
                if isLoading {
                    LoadingOverlay(message: "Speichert...")
                }
            }
        }
    }

    private func save() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                let input = SeriesInput(
                    name: name.trimmingCharacters(in: .whitespaces),
                    description: description.trimmingCharacters(in: .whitespaces).isEmpty ? nil : description.trimmingCharacters(in: .whitespaces),
                    imageUrl: imageUrl.trimmingCharacters(in: .whitespaces).isEmpty ? nil : imageUrl.trimmingCharacters(in: .whitespaces)
                )
                if let series = series {
                    _ = try await RemoteDataSource.shared.updateSeries(id: series.id, input)
                } else {
                    _ = try await RemoteDataSource.shared.createSeries(input)
                }
                await syncEngine.sync()
                dismiss()
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
