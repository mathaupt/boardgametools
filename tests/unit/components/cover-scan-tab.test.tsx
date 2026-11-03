import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ recognize: vi.fn() }));

vi.mock("next/image", () => ({ default: ({ fill, unoptimized, ...props }: Record<string, unknown>) => <img {...props} /> }));
vi.mock("tesseract.js", () => ({ recognize: mocks.recognize }));

import { CoverScanTab } from "@/components/cover-scan-tab";

describe("CoverScanTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("explains when browser camera permission is denied", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error("denied"), { name: "NotAllowedError" })) },
    });
    render(<CoverScanTab onGameSelected={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Kamera" }));

    expect(await screen.findByText("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff.")).toBeInTheDocument();
  });

  it("shows a fallback message for other camera startup errors", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("device unavailable")) },
    });
    render(<CoverScanTab onGameSelected={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Kamera" }));

    expect(await screen.findByText("Kamera konnte nicht gestartet werden.")).toBeInTheDocument();
  });

  it("extracts the most prominent title, searches BGG and returns the selected game", async () => {
    const user = userEvent.setup();
    const onGameSelected = vi.fn();
    mocks.recognize.mockResolvedValueOnce({ data: { text: "Catan\nCATAN Das Spiel" } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([
      { bggId: "13", name: "Catan", yearPublished: 1995 },
    ]), { status: 200 }));
    const { container } = render(<CoverScanTab onGameSelected={onGameSelected} />);
    const upload = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(upload).not.toBeNull();
    fireEvent.change(upload!, { target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] } });

    const titleInput = await screen.findByRole("textbox", { name: "Erkannter Spielname" });
    expect(titleInput).toHaveValue("CATAN Das Spiel");
    await user.click(screen.getByRole("button", { name: "Auf BoardGameGeek suchen" }));
    await user.click(await screen.findByRole("button", { name: "Import" }));

    expect(fetch).toHaveBeenCalledWith("/api/bgg/search?q=CATAN%20Das%20Spiel");
    expect(mocks.recognize).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/jpeg;base64,/), "deu+eng", {});
    expect(onGameSelected).toHaveBeenCalledWith("13", "");
  });

  it("shows a useful retry message when OCR returns no readable text", async () => {
    mocks.recognize.mockResolvedValueOnce({ data: { text: "  \n " } });
    const { container } = render(<CoverScanTab onGameSelected={vi.fn()} />);
    const upload = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(upload, { target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] } });

    await waitFor(() => expect(screen.getByText("Kein Text erkannt. Versuche ein schärferes Foto mit gutem Licht.")).toBeInTheDocument());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports OCR processing errors without submitting a search", async () => {
    mocks.recognize.mockRejectedValueOnce(new Error("OCR unavailable"));
    const { container } = render(<CoverScanTab onGameSelected={vi.fn()} />);
    const upload = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(upload, { target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] } });

    expect(await screen.findByText("OCR-Verarbeitung fehlgeschlagen. Versuche ein anderes Foto.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a BGG provider error and retry action instead of a no-results message", async () => {
    const user = userEvent.setup();
    mocks.recognize.mockResolvedValueOnce({ data: { text: "Catan" } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 503 }));
    const { container } = render(<CoverScanTab onGameSelected={vi.fn()} />);
    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] },
    });

    await user.click(await screen.findByRole("button", { name: "Auf BoardGameGeek suchen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("BoardGameGeek ist gerade nicht erreichbar");
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
    expect(screen.queryByText("Bearbeite den erkannten Text und suche erneut.")).not.toBeInTheDocument();
  });

  it("shows the no-results message only after a successful empty BGG response", async () => {
    const user = userEvent.setup();
    mocks.recognize.mockResolvedValueOnce({ data: { text: "Catan" } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const { container } = render(<CoverScanTab onGameSelected={vi.fn()} />);
    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] },
    });

    await screen.findByRole("textbox", { name: "Erkannter Spielname" });
    expect(screen.queryByText(/Keine passenden Spiele gefunden/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Auf BoardGameGeek suchen" }));
    expect(await screen.findByText(/Keine passenden Spiele gefunden/)).toBeInTheDocument();
  });
});
