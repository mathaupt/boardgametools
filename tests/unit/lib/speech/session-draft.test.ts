import { describe, expect, it } from "vitest";
import { parseSessionDraft } from "@/lib/speech/session-draft";
const options = { games: [{ id: "g1", name: "Azul" }, { id: "g2", name: "Mühle" }], users: [{ id: "a", name: "Anna" }, { id: "b", name: "Ben" }] };
describe("spoken session drafts", () => {
  it("resolves only provided options and an explicit duration", () => {
    expect(parseSessionDraft("Azul mit Anna und Ben, 90 Minuten", options)).toMatchObject({ gameId: "g1", userIds: ["a", "b"], durationMinutes: 90, issues: [] });
  });
  it("handles normalized Unicode and case without fuzzy matching", () => {
    expect(parseSessionDraft("MÜHLE mit anna", options)).toMatchObject({ gameId: "g2", userIds: ["a"], durationMinutes: null });
    expect(parseSessionDraft("Az mit Ann", options)).toMatchObject({ gameId: null, userIds: [], issues: [expect.any(String), expect.any(String)] });
  });
  it("leaves duplicate game and person names unresolved", () => {
    const result = parseSessionDraft("Azul mit Anna", { games: [...options.games, { id: "g3", name: "Azul" }], users: [...options.users, { id: "a2", name: "Anna" }] });
    expect(result).toMatchObject({ gameId: null, userIds: [], issues: [expect.any(String), expect.any(String)] });
  });
  it("retains unknown names and deduplicates identified participants", () => {
    expect(parseSessionDraft("Azul mit Anna, Anna und Unbekannt", options)).toMatchObject({ gameId: "g1", userIds: ["a"], issues: [expect.stringContaining("Unbekannt")] });
  });
  it.each(["0", "1441", "1.5", "-90"])("does not infer an invalid duration %s", (duration) => {
    expect(parseSessionDraft(`Azul mit Anna, ${duration} Minuten`, options).issues.length).toBeGreaterThan(0);
    expect(parseSessionDraft(`Azul mit Anna, ${duration} Minuten`, options).durationMinutes).toBeNull();
  });
  it("keeps unparsed clauses visible and does not infer other fields", () => {
    const result = parseSessionDraft("Azul mit Anna, 90 Minuten, Ben gewinnt", options);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.text).toContain("Ben gewinnt");
    expect(result).not.toHaveProperty("isWinner");
  });
  it("rejects empty and overlong inputs and leaves missing players open", () => {
    expect(parseSessionDraft("", options).issues.length).toBeGreaterThan(0);
    expect(parseSessionDraft("x".repeat(2001), options).gameId).toBeNull();
    expect(parseSessionDraft("Azul", options)).toMatchObject({ gameId: "g1", userIds: [], issues: [expect.any(String)] });
  });
});
