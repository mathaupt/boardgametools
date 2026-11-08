import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeechInput } from "@/components/speech/speech-input";
class Recognition {
  static last: Recognition;
  lang = ""; continuous = true; interimResults = true;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn(); abort = vi.fn(); stop = vi.fn();
  constructor() { Recognition.last = this; }
  result(text: string) { this.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: text }, isFinal: true }] }); }
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
beforeEach(() => { Reflect.deleteProperty(Recognition, "last"); vi.stubGlobal("SpeechRecognition", Recognition); });
async function start() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Suche diktieren" }));
  await user.click(screen.getByRole("button", { name: "Zustimmen und Aufnahme starten" }));
  return user;
}
describe("SpeechInput", () => {
  it("does not start until the browser-service notice is accepted; applies edited text explicitly", async () => {
    const onAccept = vi.fn(); const submit = vi.fn((e) => e.preventDefault());
    render(<form onSubmit={submit}><SpeechInput label="Suche diktieren" onAccept={onAccept} /></form>);
    expect(Recognition.last).toBeUndefined();
    const user = await start();
    const recognition = Recognition.last;
    expect(recognition.start).toHaveBeenCalledOnce();
    expect(recognition).toMatchObject({ lang: "de-DE", continuous: false, interimResults: false });
    act(() => { recognition.result("Azul"); recognition.onend?.(); });
    expect(onAccept).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Erkannter Text"));
    await user.type(screen.getByLabelText("Erkannter Text"), "Mühle");
    await user.click(screen.getByRole("button", { name: "Text übernehmen" }));
    expect(onAccept).toHaveBeenCalledExactlyOnceWith("Mühle");
    expect(submit).not.toHaveBeenCalled();
  });
  it("keeps manual input available when recognition is unsupported", () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    render(<SpeechInput label="Suche diktieren" onAccept={vi.fn()} />);
    expect(screen.getByText(/Spracheingabe.*nicht unterstützt/)).toBeInTheDocument();
  });
  it("discards late results after cancellation and aborts on unmount", async () => {
    const accept = vi.fn(); const { unmount } = render(<SpeechInput label="Suche diktieren" onAccept={accept} />);
    const user = await start(); const recognition = Recognition.last; const lateResult = recognition.onresult;
    await user.click(screen.getByRole("button", { name: "Aufnahme abbrechen" }));
    act(() => lateResult?.({ resultIndex: 0, results: [{ 0: { transcript: "late" }, isFinal: true }] }));
    expect(screen.queryByLabelText("Erkannter Text")).not.toBeInTheDocument();
    expect(accept).not.toHaveBeenCalled();
    expect(recognition.abort).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Suche diktieren" }));
    await user.click(screen.getByRole("button", { name: "Zustimmen und Aufnahme starten" }));
    const active = Recognition.last; unmount(); expect(active.abort).toHaveBeenCalled();
  });
  it.each(["not-allowed", "no-speech", "network"])("shows actionable error %s", async (error) => {
    render(<SpeechInput label="Suche diktieren" onAccept={vi.fn()} />);
    await start(); act(() => Recognition.last.onerror?.({ error }));
    expect(screen.getByRole("status")).toHaveTextContent(/Mikrofon|Sprache|Verbindung/);
    expect(screen.queryByRole("button", { name: "Text übernehmen" })).not.toBeInTheDocument();
  });
  it("reports silence and allows stopping before taking over text", async () => {
    render(<SpeechInput label="Suche diktieren" onAccept={vi.fn()} />);
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Aufnahme beenden" }));
    expect(Recognition.last.stop).toHaveBeenCalledOnce();
    act(() => Recognition.last.onend?.());
    expect(screen.getByRole("status")).toHaveTextContent(/Keine Sprache/);
  });
  it("limits the accepted text length", async () => {
    const accept = vi.fn(); render(<SpeechInput label="Suche diktieren" onAccept={accept} maxLength={20} />);
    await start(); act(() => { Recognition.last.result("x".repeat(21)); Recognition.last.onend?.(); });
    expect(screen.getByRole("status")).toHaveTextContent(/20/);
    expect(accept).not.toHaveBeenCalled();
  });
});

it("ends recording when the page goes into the background", async () => {
  const accept = vi.fn(); render(<SpeechInput label="Suche diktieren" onAccept={accept} />);
  await start(); const recognition = Recognition.last; const late = recognition.onresult;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(recognition.abort).toHaveBeenCalledOnce();
  act(() => late?.({ resultIndex: 0, results: [{ 0: { transcript: "late" }, isFinal: true }] }));
  expect(screen.queryByLabelText("Erkannter Text")).not.toBeInTheDocument();
  expect(accept).not.toHaveBeenCalled();
});
