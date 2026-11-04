import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupChallengesSection } from "@/app/(dashboard)/dashboard/groups/[id]/group-challenges-section";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("GroupChallengesSection", () => {
  it("shows only aggregate progress and lets a member opt in", async () => {
    const challenge = { id: "challenge-1", title: "Frühlingsspielzeit", kind: "sessions", target: 10, startsAt: "2026-11-01T00:00:00.000Z", endsAt: null, current: 3, completed: false, joined: false };
    const joined = { ...challenge, joined: true };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [challenge] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ joined: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [joined] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<GroupChallengesSection groupId="group-1" canCreate={false} />);

    expect(await screen.findByText("Frühlingsspielzeit")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("member-1");
    await user.click(screen.getByRole("button", { name: "Freiwillig mitmachen" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/groups/group-1/challenges/challenge-1/participation", { method: "POST" }));
    expect(await screen.findByRole("button", { name: "Teilnahme beenden" })).toBeInTheDocument();
  });

  it("lets group admins set a fixed target and optional end date", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    render(<GroupChallengesSection groupId="group-1" canCreate />);
    expect(await screen.findByLabelText("Zielname")).toBeInTheDocument();
    expect(screen.getByLabelText("Enddatum (optional)")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Zieltyp" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Zielgröße (Sessions)" })).toBeInTheDocument();
  });
});
