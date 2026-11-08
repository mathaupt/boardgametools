import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import { SpokenSessionDraft } from "@/components/sessions/spoken-session-draft";
afterEach(cleanup);
const options = { games: [{ id: "g1", name: "Azul" }], users: [{ id: "u1", name: "Anna" }] };
describe("SpokenSessionDraft", () => {
  it("previews a typed command and applies only after explicit confirmation", async () => {
    const onApply = vi.fn(); const user = userEvent.setup();
    render(<SpokenSessionDraft {...options} onApply={onApply} />);
    await user.type(screen.getByLabelText("Session beschreiben"), "Azul mit Anna, 90 Minuten");
    await user.click(screen.getByRole("button", { name: "Entwurf prüfen" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText("Azul · Anna · 90 Minuten")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ins Formular übernehmen" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ gameId: "g1", userIds: ["u1"], durationMinutes: 90 }));
  });
  it("shows unresolved names, invalidates a preview on text change and supports discarding", async () => {
    const onApply = vi.fn(); const user = userEvent.setup();
    render(<SpokenSessionDraft {...options} onApply={onApply} />);
    await user.type(screen.getByLabelText("Session beschreiben"), "Azul mit Unbekannt");
    await user.click(screen.getByRole("button", { name: "Entwurf prüfen" }));
    expect(screen.getByText(/Person ungeklärt.*Unbekannt/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Session beschreiben"), " und Anna");
    expect(screen.queryByRole("button", { name: "Ins Formular übernehmen" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entwurf prüfen" }));
    await user.click(screen.getByRole("button", { name: "Entwurf verwerfen" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Session beschreiben")).toHaveValue("");
  });
});
