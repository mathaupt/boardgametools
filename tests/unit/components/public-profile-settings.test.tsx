import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicProfileSettings } from "@/app/(dashboard)/dashboard/profile/public-profile-settings";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("PublicProfileSettings", () => {
  it("keeps sharing off until the owner explicitly enables it", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: false, featuredBadgeIds: [], shareUrl: null, earnedBadges: [{ id: "first-session", title: "Erste Spielrunde", description: "Erste Runde" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true, featuredBadgeIds: [], shareUrl: "https://example.invalid/public/profile#opaque" }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PublicProfileSettings />);
    const toggle = await screen.findByRole("checkbox", { name: /öffentliches abzeichenprofil aktivieren/i });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/users/me/public-profile", expect.objectContaining({ method: "PATCH" })));
    expect(await screen.findByText("Profilfreigabe gespeichert.")).toBeInTheDocument();
  });

  it("does not render personal email, group, or event details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false, featuredBadgeIds: [], shareUrl: null, earnedBadges: [] }) }));
    render(<PublicProfileSettings />);
    await screen.findByRole("checkbox", { name: /öffentliches abzeichenprofil aktivieren/i });
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    expect(document.body.textContent).not.toContain("Meine private Gruppe");
    expect(document.body.textContent).not.toContain("Meine private Sessionnotiz");
  });

  it("allows the owner to remove every featured badge", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true, featuredBadgeIds: ["first-session"], shareUrl: "https://example.invalid/public/profile#opaque", earnedBadges: [{ id: "first-session", title: "Erste Spielrunde", description: "Erste Runde" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true, featuredBadgeIds: [], shareUrl: "https://example.invalid/public/profile#opaque" }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PublicProfileSettings />);
    await user.click(await screen.findByRole("checkbox", { name: "Erste Spielrunde" }));
    const save = screen.getByRole("button", { name: "Auswahl speichern" });
    expect(save).toBeEnabled();
    await user.click(save);
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/users/me/public-profile", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ enabled: true, rotate: false, featuredBadgeIds: [] }) })));
  });
});
