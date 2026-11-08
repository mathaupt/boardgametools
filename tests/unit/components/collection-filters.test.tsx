import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CollectionFilters } from "@/app/(dashboard)/dashboard/games/collection-filters";
vi.mock("@/components/speech/speech-input", () => ({ SpeechInput: ({ onAccept, label }: { onAccept: (text: string) => void; label: string }) => <button onClick={() => onAccept("Azul")}>{label}</button> }));
afterEach(cleanup);
it("changes collection search only when dictation is accepted", async () => {
  const search = vi.fn(); const user = userEvent.setup();
  render(<CollectionFilters searchText="" setSearchText={search} playerCount="all" setPlayerCount={vi.fn()} sortOption="name_asc" setSortOption={vi.fn()} minComplexity={null} setMinComplexity={vi.fn()} activeTag={null} setActiveTag={vi.fn()} allTags={[]} />);
  expect(search).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Suche diktieren" }));
  expect(search).toHaveBeenCalledExactlyOnceWith("Azul");
});
