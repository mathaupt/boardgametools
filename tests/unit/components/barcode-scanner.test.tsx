import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BarcodeScanner } from "@/components/barcode-scanner";

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: class {
    getState() { return 0; }
    async start() { throw Object.assign(new Error("NotAllowed camera access"), { name: "NotAllowedError" }); }
    async stop() {}
  },
}));

const props = {
  open: true,
  onOpenChange: vi.fn(),
  onGameSelected: vi.fn(),
  onLocalGameFound: vi.fn(),
};

describe("BarcodeScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("cleans a manual barcode, shows a local match and selects it", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      source: "local",
      ean: "4010350612428",
      localGame: { id: "game-1", name: "Catan", imageUrl: null, bggId: "13" },
      bggResults: [],
    }), { status: 200 }));
    render(<BarcodeScanner {...props} />);

    await user.type(screen.getByRole("textbox", { name: "EAN eingeben" }), "4010350612428");
    await user.click(screen.getByRole("button", { name: "Suchen" }));

    expect(await screen.findByText("Bereits in deiner Sammlung")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/barcode/lookup?ean=4010350612428");
    await user.click(screen.getByRole("button", { name: "Auswählen" }));
    expect(props.onLocalGameFound).toHaveBeenCalledWith("game-1");
  });

  it("shows a validation error for a barcode shorter than eight digits", async () => {
    const user = userEvent.setup();
    render(<BarcodeScanner {...props} />);

    await user.type(screen.getByRole("textbox", { name: "EAN eingeben" }), "12345");
    await user.click(screen.getByRole("button", { name: "Suchen" }));

    expect(await screen.findByText("Ungültiger Barcode. EAN muss mindestens 8 Ziffern haben.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows an API error and lets the user retry", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Limit erreicht" }), { status: 429 }));
    render(<BarcodeScanner {...props} />);

    await user.type(screen.getByRole("textbox", { name: "EAN eingeben" }), "4010350612428");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByText("Limit erreicht")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(screen.queryByText("Limit erreicht")).not.toBeInTheDocument();
  });

  it("explains denied camera access and preserves manual barcode entry", async () => {
    const user = userEvent.setup();
    render(<BarcodeScanner {...props} />);

    await user.click(screen.getByRole("button", { name: "Kamera starten" }));

    expect(await screen.findByText("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "EAN eingeben" })).toBeInTheDocument();
  });

  it("resets scanner form state when the dialog closes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BarcodeScanner {...props} />);
    const input = screen.getByRole("textbox", { name: "EAN eingeben" });
    await user.type(input, "4010350612428");

    rerender(<BarcodeScanner {...props} open={false} />);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    rerender(<BarcodeScanner {...props} open />);
    expect(screen.getByRole("textbox", { name: "EAN eingeben" })).toHaveValue("");
  });
});
