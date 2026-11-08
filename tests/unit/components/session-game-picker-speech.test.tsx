import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { SessionGamePicker } from "@/components/sessions/session-game-picker";
vi.mock("@/components/speech/speech-input", () => ({ SpeechInput: ({ onAccept, label }: { onAccept: (text: string) => void; label: string }) => <button onClick={() => onAccept("Azul")}>{label}</button> }));
afterEach(cleanup);
it("uses accepted dictation as local search without selecting a game", async () => {
  const change = vi.fn(); const user = userEvent.setup();
  render(<SessionGamePicker games={[{ id: "azul", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 }, { id: "catan", name: "Catan", imageUrl: null, minPlayers: 2, maxPlayers: 4 }]} value="" onValueChange={change} id="picker" />);
  await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
  expect(screen.getAllByRole("option")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Spielsuche diktieren" }));
  expect(screen.getByRole("combobox")).toHaveValue("Azul");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(change).not.toHaveBeenCalled();
});
