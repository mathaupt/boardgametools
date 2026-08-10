import SwiftUI
import VisionKit

struct BarcodeScannerView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SyncEngine.self) private var syncEngine

    @State private var scannedCode: String?
    @State private var errorMessage: String?
    @State private var isImporting = false
    @State private var discoveredGame: GameDTO?

    var body: some View {
        NavigationStack {
            ZStack {
                if DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
                    DataScannerRepresentable(onCode: { code in
                        if scannedCode == nil {
                            scannedCode = code
                            Task { await lookupAndImport(code: code) }
                        }
                    })
                    .ignoresSafeArea(.container, edges: .bottom)
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "barcode.viewfinder")
                            .font(.system(size: 56))
                            .foregroundStyle(.secondary)
                        Text("Barcode-Scanner nicht verfügbar")
                            .font(.headline)
                        Text("Dieses Gerät unterstützt keinen Live-Scan. Du kannst die EAN auch manuell eingeben.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(32)
                }

                if isImporting {
                    LoadingOverlay(message: "Suche auf BGG...")
                }

                if let errorMessage = errorMessage {
                    VStack {
                        Spacer()
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .padding()
                            .background(.regularMaterial)
                            .clipShape(.rect(cornerRadius: 12))
                            .padding()
                    }
                }
            }
            .navigationTitle("Barcode scannen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fertig") { dismiss() }
                }
            }
            .sheet(item: $discoveredGame) { game in
                GameEditView(existingGame: game)
            }
        }
    }

    private func lookupAndImport(code: String) async {
        isImporting = true
        errorMessage = nil
        do {
            let result = try await RemoteDataSource.shared.bggLookup(ean: code)
            let imported = try await RemoteDataSource.shared.bggImport(bggId: result.bggId)
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

struct DataScannerRepresentable: UIViewControllerRepresentable {
    let onCode: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onCode: onCode)
    }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [
                .barcode(symbologies: [.ean8, .ean13, .upce])
            ],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        try? scanner.startScanning()
        return scanner
    }

    func updateUIViewController(_ uiViewController: DataScannerViewController, context: Context) {}

    func dismantleUIViewController(_ uiViewController: DataScannerViewController, context: Context) {
        uiViewController.stopScanning()
    }

    class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onCode: (String) -> Void

        init(onCode: @escaping (String) -> Void) {
            self.onCode = onCode
        }

        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            for item in addedItems {
                if case .barcode(let barcode) = item,
                   let payload = barcode.payloadStringValue {
                    onCode(payload)
                }
            }
        }
    }
}
