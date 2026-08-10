import SwiftUI
import Vision
import UIKit

struct CoverOCRView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine

    @State private var image: UIImage?
    @State private var recognizedText: String?
    @State private var isProcessing = false
    @State private var isImporting = false
    @State private var errorMessage: String?
    @State private var showCamera = false
    @State private var discoveredGame: GameDTO?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let image = image {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 300)
                            .clipShape(.rect(cornerRadius: 16))
                    } else {
                        ZStack {
                            Theme.primaryGradient
                            Image(systemName: "camera.viewfinder")
                                .font(.system(size: 56))
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        .frame(height: 240)
                        .clipShape(.rect(cornerRadius: 16))
                    }

                    Button {
                        showCamera = true
                    } label: {
                        Label(image == nil ? "Foto aufnehmen" : "Neues Foto", systemImage: "camera")
                            .themeGradientButton()
                    }

                    if let recognizedText = recognizedText, !recognizedText.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Erkannter Titel")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(recognizedText)
                                .font(.headline)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.cardBackground)
                        .clipShape(.rect(cornerRadius: 12))

                        Button {
                            Task { await searchAndImport(query: recognizedText) }
                        } label: {
                            if isImporting {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Auf BGG suchen")
                            }
                        }
                        .themeGradientButton(Theme.coolGradient)
                        .disabled(isImporting)
                    }

                    if isProcessing {
                        LoadingOverlay(message: "Text erkennen...")
                    }

                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }

                    Spacer()
                }
                .padding()
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Cover scannen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fertig") { dismiss() }
                }
            }
            .sheet(isPresented: $showCamera) {
                ImagePicker(sourceType: .camera, selectedImage: $image)
            }
            .onChange(of: image) { _, _ in
                if image != nil {
                    Task { await recognizeText() }
                }
            }
            .sheet(item: $discoveredGame) { game in
                GameEditView(existingGame: game)
            }
        }
    }

    private func recognizeText() async {
        guard let image = image, let cgImage = image.cgImage else { return }
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        let request = VNRecognizeTextRequest { request, error in
            guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
            let candidates = observations.compactMap { $0.topCandidates(1).first?.string }
            DispatchQueue.main.async {
                self.recognizedText = candidates.prefix(3).joined(separator: " ")
            }
        }
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
        }
    }

    private func searchAndImport(query: String) async {
        isImporting = true
        errorMessage = nil
        do {
            let results = try await RemoteDataSource.shared.bggSearch(query: query)
            guard let first = results.first else {
                throw APIError.notFound
            }
            let imported = try await RemoteDataSource.shared.bggImport(bggId: first.bggId)
            await syncEngine.sync()
            discoveredGame = imported
        } catch let error as APIError {
            errorMessage = error.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isImporting = false
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    let sourceType: UIImagePickerController.SourceType
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePicker

        init(parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
