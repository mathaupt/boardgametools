import { describe, it, expect } from "vitest";
import { faqSections } from "@/lib/faq";

describe("faqSections", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(faqSections)).toBe(true);
    expect(faqSections.length).toBeGreaterThan(0);
  });

  it("every section has id, title, and items", () => {
    for (const section of faqSections) {
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(Array.isArray(section.items)).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it("section IDs are unique", () => {
    const ids = faqSections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every item has non-empty question and answer", () => {
    for (const section of faqSections) {
      for (const item of section.items) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("explains the five direct mobile destinations and the Mehr section", () => {
    const answer = faqSections.flatMap((section) => section.items).find((item) => item.question === "Wo finde ich die Webnavigation auf dem Smartphone?")?.answer;
    expect(answer).toContain("Dashboard");
    expect(answer).toContain("Spieleabende");
    expect(answer).toContain("Gruppen");
    expect(answer).toContain("unter „Mehr“");
    expect(answer).toContain("Reihen");
    expect(answer).toContain("Abzeichen");
    expect(answer).not.toContain("Events und Statistiken sowie");
  });
});
