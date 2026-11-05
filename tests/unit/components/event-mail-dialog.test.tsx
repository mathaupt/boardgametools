import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventMailDialog } from "@/components/event-mail-dialog";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("EventMailDialog", () => {
  it("zeigt Empfängerzahlen, validiert Nachrichtentext und sendet Nachricht erfolgreich", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ failedCount: 0, message: "2 Nachrichten gesendet" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<EventMailDialog eventId="event-1" eventTitle="Catan-Abend" totalInvites={3} acceptedCount={2} />);

    await user.click(screen.getAllByRole("button", { name: "Nachricht" })[0]);
    expect(screen.getByText("2", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nachricht senden" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Nachricht" }), "Hallo zusammen");
    await user.clear(screen.getByLabelText("Betreff"));
    await user.type(screen.getByLabelText("Betreff"), "  Neuer Betreff  ");
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    expect(await screen.findByText("2 Nachrichten gesendet")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/events/event-1/mail", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ type: "custom", subject: "Neuer Betreff", message: "Hallo zusammen" }),
    }));
    expect(screen.getByRole("textbox", { name: "Nachricht" })).toHaveValue("");
  });

  it("zeigt Erinnerungs-Leerzustand und sendet Erinnerung für Zusagende", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ failedCount: 1, message: "Teilweise gesendet", errors: ["Adresse nicht erreichbar"] }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { rerender } = render(<EventMailDialog eventId="e" eventTitle="Abend" totalInvites={0} acceptedCount={0} />);
    await user.click(screen.getAllByRole("button", { name: "Nachricht" })[0]);
    await user.click(screen.getByRole("tab", { name: "Erinnerung" }));
    expect(screen.getByText(/Noch niemand hat zugesagt/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Erinnerung senden" })).not.toBeInTheDocument();

    rerender(<EventMailDialog eventId="e" eventTitle="Abend" totalInvites={0} acceptedCount={1} />);
    await user.click(screen.getByRole("tab", { name: "Erinnerung" }));
    await user.click(screen.getByRole("button", { name: "Erinnerung senden" }));
    expect(await screen.findByText("Adresse nicht erreichbar")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/events/e/mail", expect.objectContaining({ body: JSON.stringify({ type: "reminder" }) }));
  });

  it("zeigt API- und Netzwerkfehler und setzt Ergebnis beim Schließen zurück", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Kein Zugriff" }, { status: 403 }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<EventMailDialog eventId="e" eventTitle="Abend" totalInvites={1} acceptedCount={1} />);
    await user.click(screen.getAllByRole("button", { name: "Nachricht" })[0]);
    await user.type(screen.getByRole("textbox", { name: "Nachricht" }), "Text");
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));
    expect(await screen.findByText("Kein Zugriff")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));
    expect(await screen.findByText("Netzwerkfehler beim Senden")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Netzwerkfehler beim Senden")).not.toBeInTheDocument());
  });
});
