import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(dashboard)/dashboard/groups/[id]/game-option-picker", () => ({
  GameOptionPicker: ({ onOptionsChange, onOptionsAreGamesChange }: any) => <button type="button" onClick={() => {
    onOptionsChange(["Catan", "Azul"]);
    onOptionsAreGamesChange(true);
  }}>Spiele als Optionen</button>,
}));

import { CreatePollForm } from "@/app/(dashboard)/dashboard/groups/[id]/create-poll-form";

describe("CreatePollForm", () => {
  const props = { groupId: "group-1", loading: "", setLoading: vi.fn(), onCreated: vi.fn(), onCancel: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requires two non-empty options before sending a request", async () => {
    const user = userEvent.setup();
    render(<CreatePollForm {...props} />);
    await user.type(screen.getByLabelText("Frage / Titel *"), "Nächstes Spiel?");
    await user.type(screen.getByPlaceholderText("Option 1"), "Catan");
    await user.click(screen.getByRole("button", { name: "Abstimmung erstellen" }));

    expect(await screen.findByText("Mindestens 2 Optionen erforderlich")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(props.setLoading).not.toHaveBeenCalledWith("poll");
  });

  it("adds and removes options and posts trimmed valid options", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<CreatePollForm {...props} />);
    await user.type(screen.getByLabelText("Frage / Titel *"), "Legacy-Spiel?");
    await user.type(screen.getByLabelText("Beschreibung"), "Für die nächste Runde");
    await user.click(screen.getByLabelText("Mehrfachwahl"));
    await user.click(screen.getByRole("button", { name: "Option hinzufügen" }));
    await user.type(screen.getByPlaceholderText("Option 1"), " Catan ");
    await user.type(screen.getByPlaceholderText("Option 2"), " Azul ");
    await user.type(screen.getByPlaceholderText("Option 3"), " Ticket to Ride ");
    await user.click(screen.getByRole("button", { name: "Option 2 entfernen" }));
    await user.click(screen.getByRole("button", { name: "Abstimmung erstellen" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/groups/group-1/polls", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "Legacy-Spiel?", description: "Für die nächste Runde", type: "multiple", options: [" Catan ", " Ticket to Ride "] }),
    })));
    expect(props.onCreated).toHaveBeenCalledOnce();
    expect(props.setLoading).toHaveBeenNthCalledWith(1, "poll");
    expect(props.setLoading).toHaveBeenLastCalledWith("");
  });

  it("uses game options, supports an empty description, and displays API errors", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Abstimmung nicht möglich" }) } as Response);
    render(<CreatePollForm {...props} />);
    await user.type(screen.getByLabelText("Frage / Titel *"), "Spielauswahl");
    await user.click(screen.getByRole("button", { name: "Spiele als Optionen" }));
    expect(screen.queryByPlaceholderText("Option 1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abstimmung erstellen" }));

    expect(await screen.findByText("Abstimmung nicht möglich")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/groups/group-1/polls", expect.objectContaining({
      body: JSON.stringify({ title: "Spielauswahl", description: null, type: "single", options: ["Catan", "Azul"] }),
    }));
    expect(props.onCreated).not.toHaveBeenCalled();
    expect(props.setLoading).toHaveBeenLastCalledWith("");
  });

  it("calls the cancel handler", async () => {
    const user = userEvent.setup();
    render(<CreatePollForm {...props} />);
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });
});
