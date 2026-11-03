import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BarcodeResultsPanel } from "@/components/barcode-results-panel";

const baseResult = {
  source: "not_found" as const,
  ean: "4000000000012",
  localGame: null,
  bggResults: [],
};

describe("BarcodeResultsPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a local collection match and selects it when requested", async () => {
    const onLocalGameFound = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeResultsPanel
      result={{ ...baseResult, source: "local", localGame: { id: "game-1", name: "Catan", imageUrl: null, bggId: null } }}
      scannedEan={null}
      onGameSelected={vi.fn()}
      onLocalGameFound={onLocalGameFound}
      onScanAgain={vi.fn()}
    />);

    expect(screen.getByText("Bereits in deiner Sammlung")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Auswählen" }));
    expect(onLocalGameFound).toHaveBeenCalledWith("game-1");
    expect(screen.queryByLabelText("Spielname eingeben")).not.toBeInTheDocument();
  });

  it("renders BGG results and uses the result EAN for an import", async () => {
    const onGameSelected = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeResultsPanel
      result={{ ...baseResult, source: "upcitemdb", productName: "Catan", cleanedName: "Catan", bggResults: [{ bggId: "13", name: "Catan", yearPublished: 1995 }] }}
      scannedEan={null}
      onGameSelected={onGameSelected}
      onScanAgain={vi.fn()}
    />);

    expect(screen.getByText("1995")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Importieren" }));
    expect(onGameSelected).toHaveBeenCalledWith("13", "4000000000012");
  });

  it("does not search with a one-character fallback name and searches a trimmed query", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [{ bggId: "13", name: "Catan", yearPublished: null }] } as Response);
    render(<BarcodeResultsPanel result={baseResult} scannedEan="scan-ean" onGameSelected={vi.fn()} onScanAgain={vi.fn()} />);

    await user.type(screen.getByLabelText("Spielname eingeben"), "c");
    expect(screen.getByRole("button", { name: "Suchen" })).toBeDisabled();
    await user.type(screen.getByLabelText("Spielname eingeben"), "atan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/bgg/search?q=catan"));
    expect(await screen.findByText("Catan")).toBeInTheDocument();
  });

  it("selects a fallback result with the scanned EAN", async () => {
    const onGameSelected = vi.fn();
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [{ bggId: "13", name: "Catan", yearPublished: 1995 }] } as Response);
    render(<BarcodeResultsPanel result={baseResult} scannedEan="scan-ean" onGameSelected={onGameSelected} onScanAgain={vi.fn()} />);

    await user.type(screen.getByLabelText("Spielname eingeben"), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("button", { name: "Importieren" }));
    expect(onGameSelected).toHaveBeenCalledWith("13", "scan-ean");
  });

  it("shows an empty-results message and offers a new scan", async () => {
    const onScanAgain = vi.fn();
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);
    render(<BarcodeResultsPanel result={baseResult} scannedEan={null} onGameSelected={vi.fn()} onScanAgain={onScanAgain} />);

    await user.type(screen.getByLabelText("Spielname eingeben"), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByText("Keine Ergebnisse. Versuche einen anderen Suchbegriff.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Neuen Barcode scannen" }));
    expect(onScanAgain).toHaveBeenCalledOnce();
  });

  it("does not call selection without an EAN and tolerates a failed fallback request", async () => {
    const onGameSelected = vi.fn();
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    render(<BarcodeResultsPanel
      result={{ ...baseResult, source: "upcitemdb", bggResults: [] }}
      scannedEan={null}
      onGameSelected={onGameSelected}
      onScanAgain={vi.fn()}
    />);

    await user.type(screen.getByLabelText("Spielname eingeben"), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("BoardGameGeek ist gerade nicht erreichbar"));
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
    expect(screen.queryByText("Keine Ergebnisse. Versuche einen anderen Suchbegriff.")).not.toBeInTheDocument();
    expect(onGameSelected).not.toHaveBeenCalled();
  });
});
