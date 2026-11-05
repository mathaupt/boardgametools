import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const m = vi.hoisted(() => ({ refresh: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
vi.mock("@/app/(dashboard)/dashboard/groups/[id]/group-members-section", () => ({ GroupMembersSection: (p: any) => <section><button onClick={p.onToggleAddMember}>Mitgliedsformular</button><input aria-label="Mitglieds-E-Mail" value={p.memberEmail} onChange={(e) => p.onMemberEmailChange(e.target.value)} /><button onClick={() => p.onAddMember({ preventDefault: vi.fn() })}>Mitglied hinzufügen</button><button onClick={() => p.onRemoveMember("member-1")}>Mitglied entfernen</button>{p.memberError}</section> }));
vi.mock("@/app/(dashboard)/dashboard/groups/[id]/group-polls-section", () => ({ GroupPollsSection: (p: any) => <section><button onClick={p.onToggleCreatePoll}>Umfrage erstellen</button><button onClick={p.onPollCreated}>Umfrage gespeichert</button><button onClick={p.onRefresh}>Umfragen aktualisieren</button></section> }));
vi.mock("@/app/(dashboard)/dashboard/groups/[id]/group-comments-section", () => ({ GroupCommentsSection: (p: any) => <section><input aria-label="Kommentar" value={p.comment} onChange={(e) => p.onCommentChange(e.target.value)} /><button onClick={p.onSubmitComment}>Kommentar senden</button></section> }));
vi.mock("@/app/(dashboard)/dashboard/groups/[id]/group-challenges-section", () => ({ GroupChallengesSection: (p: any) => <div>Challenges erlaubt: {String(p.canCreate)}</div> }));
import { GroupDetailClient } from "@/app/(dashboard)/dashboard/groups/[id]/group-detail-client";
const group = { id: "g1", name: "Freitagsrunde", description: "Brettspiele", password: "secret", members: [{ userId: "u1", role: "admin" }], comments: [] } as any;
beforeEach(() => { m.refresh.mockReset(); m.fetch.mockReset(); vi.stubGlobal("fetch", m.fetch); });

describe("GroupDetailClient", () => {
  it("publiziert Gruppe, kopiert Link und speichert Passwort", async () => {
    m.fetch.mockResolvedValueOnce(Response.json({ shareToken: "share-1" })); m.fetch.mockResolvedValueOnce(Response.json({}));
    const user = userEvent.setup(); render(<GroupDetailClient group={group} userId="u1" isOwner initialPublicUrl={null} />);
    await user.click(screen.getByRole("button", { name: /Öffentlichen Link erstellen/ }));
    await waitFor(() => expect(screen.getByDisplayValue(/public\/group\/share-1/)).toBeInTheDocument());
    expect(screen.getByText("Passwortgeschützt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Link kopieren" }));
    expect(screen.getByRole("button", { name: "Link kopiert" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Einstellungen" }));
    await user.clear(screen.getByLabelText("Seitenpasswort (optional)")); await user.type(screen.getByLabelText("Seitenpasswort (optional)"), "new-secret");
    await user.click(screen.getByRole("button", { name: "Speichern" }));
    expect(m.fetch).toHaveBeenLastCalledWith("/api/groups/g1", expect.objectContaining({ method: "PUT", body: JSON.stringify({ password: "new-secret" }) }));
    expect(m.refresh).toHaveBeenCalled();
  });

  it("verarbeitet Mitglieder, Kommentare und Umfrageaktionen und zeigt API-Fehler", async () => {
    m.fetch.mockResolvedValueOnce(Response.json({ error: "Nutzer nicht gefunden" }, { status: 404 }));
    m.fetch.mockResolvedValueOnce(Response.json({})); m.fetch.mockResolvedValueOnce(Response.json({}));
    const user = userEvent.setup(); render(<GroupDetailClient group={{ ...group, password: null }} userId="u1" isOwner={false} initialPublicUrl="https://example.test/group" />);
    expect(screen.getByText("Challenges erlaubt: true")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Mitglieds-E-Mail"), "missing@example.test"); await user.click(screen.getByRole("button", { name: "Mitglied hinzufügen" }));
    expect(await screen.findByText("Nutzer nicht gefunden")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mitglied entfernen" }));
    expect(m.fetch).toHaveBeenLastCalledWith("/api/groups/g1/members", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ userId: "member-1" }) }));
    await user.type(screen.getByLabelText("Kommentar"), "  Hallo Gruppe  "); await user.click(screen.getByRole("button", { name: "Kommentar senden" }));
    expect(m.fetch).toHaveBeenLastCalledWith("/api/groups/g1/comments", expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "Hallo Gruppe", pollId: null }) }));
    await user.click(screen.getByRole("button", { name: "Umfrage gespeichert" })); expect(m.refresh).toHaveBeenCalled();
  });

  it("schaltet öffentliche Linkerstellung nur für Eigentümer frei und ignoriert leere Kommentare", async () => {
    const user = userEvent.setup(); render(<GroupDetailClient group={{ ...group, members: [], password: null }} userId="guest" isOwner={false} initialPublicUrl={null} />);
    expect(screen.getByText("Challenges erlaubt: false")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kommentar senden" })); expect(m.fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Öffentlichen Link erstellen/ })).toBeInTheDocument();
  });
});
