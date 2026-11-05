import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ toast: vi.fn(), fetch: vi.fn() }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/app/(dashboard)/dashboard/events/[id]/invite/add-invite-form", () => ({ AddInviteForm: (props: any) => <div>
  <input aria-label="E-Mail" value={props.newEmail} onChange={(e) => props.onNewEmailChange(e.target.value)} />
  <button onClick={props.onAddInvite}>E-Mail einladen</button>
  <select aria-label="Nutzer" value={props.selectedUserId} onChange={(e) => props.onSelectedUserIdChange(e.target.value)}><option value="">Auswählen</option>{props.users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
  <button onClick={props.onAddUserInvite}>Nutzer einladen</button>
</div> }));
vi.mock("@/app/(dashboard)/dashboard/events/[id]/invite/invite-list", () => ({ InviteList: ({ invites, onRemoveInvite, onResendInvite }: any) => <ul>{invites.map((i: any) => <li key={i.id}>{i.email || i.user?.name}<button onClick={() => onRemoveInvite(i.id)}>Entfernen {i.id}</button><button onClick={() => onResendInvite(i.id)}>Erinnern {i.id}</button></li>)}</ul>, InviteStatusSummary: ({ invites }: any) => <output>{invites.length} Einladungen</output> }));
import InviteClient from "@/app/(dashboard)/dashboard/events/[id]/invite/invite-client";
const initialEvent = { title: "Spieleabend", eventDate: "2026-11-20T18:00:00.000Z", invites: [{ id: "old", email: "old@example.test", status: "pending" as const }] };
const eventWithTwoInvites = { ...initialEvent, invites: [...initialEvent.invites, { id: "next", email: "next@example.test", status: "pending" as const }] };
const initialUsers = [{ id: "u1", name: "Alex", email: "alex@example.test" }];
beforeEach(() => { mocks.toast.mockReset(); mocks.fetch.mockReset(); vi.stubGlobal("fetch", mocks.fetch); });

describe("EventInviteClient", () => {
  it("legt E-Mail- und Nutzer-Einladungen an und ergänzt die Statusübersicht", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ id: "mail", email: "new@example.test", status: "pending" }));
    mocks.fetch.mockResolvedValueOnce(Response.json({ id: "user", user: { id: "u1", name: "Alex", email: "alex@example.test" }, status: "pending" }));
    const user = userEvent.setup(); render(<InviteClient initialEvent={initialEvent} initialUsers={initialUsers} eventId="e1" />);
    await user.type(screen.getByRole("textbox", { name: "E-Mail" }), "  new@example.test  ");
    await user.click(screen.getByRole("button", { name: "E-Mail einladen" }));
    expect(await screen.findByText("new@example.test")).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenLastCalledWith("/api/events/e1/invites", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "new@example.test" }) }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Nutzer" }), "u1");
    await user.click(screen.getByRole("button", { name: "Nutzer einladen" }));
    expect(await screen.findByText("Alex", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText("3 Einladungen")).toBeInTheDocument();
  });

  it("zeigt Anlagefehler und kann Einladungen erneut senden", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ error: "Adresse ungültig" }, { status: 400 }));
    mocks.fetch.mockResolvedValueOnce(Response.json({ error: "offline" }, { status: 503 }));
    const user = userEvent.setup(); render(<InviteClient initialEvent={initialEvent} initialUsers={initialUsers} eventId="e1" />);
    await user.type(screen.getByRole("textbox", { name: "E-Mail" }), "bad");
    await user.click(screen.getByRole("button", { name: "E-Mail einladen" }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: "Adresse ungültig", variant: "destructive" })));
    await user.click(screen.getByRole("button", { name: "Erinnern old" }));
    expect(mocks.toast).toHaveBeenLastCalledWith(expect.objectContaining({ description: "Fehler beim Senden", variant: "destructive" }));
  });

  it("entfernt nach Bestätigung und meldet Fehler beim Löschen", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({}));
    mocks.fetch.mockResolvedValueOnce(Response.json({}, { status: 500 }));
    const user = userEvent.setup(); render(<InviteClient initialEvent={eventWithTwoInvites} initialUsers={[]} eventId="e1" />);
    await user.click(screen.getByRole("button", { name: "Entfernen old" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Entfernen$/ }));
    await waitFor(() => expect(screen.queryByText("old@example.test")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Entfernen next" }));
    await user.click(screen.getByRole("button", { name: /^Entfernen$/ }));
    await waitFor(() => expect(mocks.toast).toHaveBeenLastCalledWith(expect.objectContaining({ description: "Fehler beim Entfernen", variant: "destructive" })));
  });
});
