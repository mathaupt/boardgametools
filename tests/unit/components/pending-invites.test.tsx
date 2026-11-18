import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
import { PendingInvites, type PendingInvite } from "@/components/pending-invites";

const invite: PendingInvite = {
  id: "invite-1", eventId: "event-1", status: "pending",
  event: { id: "event-1", title: "Freitagsrunde", eventDate: "2026-11-20T18:00:00.000Z", location: "Vereinsraum", createdBy: { name: "Alex" } },
};

beforeEach(() => { mocks.toast.mockReset(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("PendingInvites", () => {
  it("meldet erfolgreiche Antworten und entfernt die Einladung", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite]} />);
    await user.click(screen.getByRole("button", { name: "Zusagen" }));
    await waitFor(() => expect(screen.queryByText("Freitagsrunde")).not.toBeInTheDocument());
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Einladung beantwortet", description: expect.stringContaining("zugesagt") }));
  });

  it("zeigt HTTP-Fehler an und ermöglicht die Wiederholung derselben Antwort", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Einladung ist nicht mehr offen." }, { status: 409 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite]} />);
    await user.click(screen.getByRole("button", { name: "Zusagen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Einladung ist nicht mehr offen.");
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    await waitFor(() => expect(screen.queryByText("Freitagsrunde")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: "accepted" });
  });

  it("zeigt Netzwerkfehler mit Wiederholungsmöglichkeit statt sie nur zu protokollieren", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite]} />);
    await user.click(screen.getByRole("button", { name: "Absagen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Verbindung fehlgeschlagen");
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
    expect(screen.getByText("Freitagsrunde")).toBeInTheDocument();
  });

  it("zeigt den laufenden Vorgang an und verhindert doppelte Antworten", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveResponse = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite]} />);
    await user.click(screen.getByRole("button", { name: "Zusagen" }));
    expect(screen.getByRole("status")).toHaveTextContent("Antwort wird gespeichert");
    expect(screen.getByRole("button", { name: "Zusagen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Absagen" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveResponse(new Response(null, { status: 204 }));
    await waitFor(() => expect(screen.queryByText("Freitagsrunde")).not.toBeInTheDocument());
  });

  it("behält Fehler getrennt pro Einladung", async () => {
    const secondInvite = { ...invite, id: "invite-2", eventId: "event-2", event: { ...invite.event, id: "event-2", title: "Sonntagsrunde" } };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Fehler bei Einladung 1" }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ error: "Fehler bei Einladung 2" }, { status: 503 })));
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite, secondInvite]} />);
    await user.click(screen.getAllByRole("button", { name: "Zusagen" })[0]);
    expect(await screen.findByText("Fehler bei Einladung 1")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Zusagen" })[1]);
    expect(await screen.findByText("Fehler bei Einladung 2")).toBeInTheDocument();
    expect(screen.getByText("Fehler bei Einladung 1")).toBeInTheDocument();
  });

  it("verarbeitet parallele Antworten für verschiedene Einladungen unabhängig", async () => {
    const secondInvite = { ...invite, id: "invite-2", eventId: "event-2", event: { ...invite.event, id: "event-2", title: "Sonntagsrunde" } };
    const resolvers: Array<(response: Response) => void> = [];
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { resolvers.push(resolve); })));
    const user = userEvent.setup();
    render(<PendingInvites invites={[invite, secondInvite]} />);
    await user.click(screen.getAllByRole("button", { name: "Zusagen" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Zusagen" })[1]);
    expect(screen.getAllByRole("status")).toHaveLength(2);
    resolvers[0](new Response(null, { status: 204 }));
    await waitFor(() => expect(screen.getAllByRole("status")).toHaveLength(1));
    resolvers[1](new Response(null, { status: 204 }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByText("Freitagsrunde")).not.toBeInTheDocument();
    expect(screen.queryByText("Sonntagsrunde")).not.toBeInTheDocument();
  });
});
