import { describe, it, expect } from "vitest";
import { validateString, validateNumber, validateEmail, validateUrl, validateDate, validateEnum, firstError } from "@/lib/validation";

describe("validateString", () => {
  it("returns error for missing required value", () => {
    expect(validateString(undefined, "Name")).toBe("Name ist erforderlich");
    expect(validateString(null, "Name")).toBe("Name ist erforderlich");
    expect(validateString("", "Name")).toBe("Name ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateString(undefined, "Name", { required: false })).toBeNull();
    expect(validateString(null, "Name", { required: false })).toBeNull();
    expect(validateString("", "Name", { required: false })).toBeNull();
  });

  it("returns error for non-string type", () => {
    expect(validateString(123, "Name")).toBe("Name muss ein Text sein");
    expect(validateString(true, "Name")).toBe("Name muss ein Text sein");
    expect(validateString({}, "Name")).toBe("Name muss ein Text sein");
  });

  it("validates minimum length on trimmed value", () => {
    expect(validateString("ab", "Name", { min: 3 })).toBe("Name muss mindestens 3 Zeichen lang sein");
    expect(validateString("  a  ", "Name", { min: 3 })).toBe("Name muss mindestens 3 Zeichen lang sein");
    expect(validateString("abc", "Name", { min: 3 })).toBeNull();
  });

  it("validates maximum length", () => {
    expect(validateString("abcdef", "Name", { max: 5 })).toBe("Name darf maximal 5 Zeichen lang sein");
    expect(validateString("abcde", "Name", { max: 5 })).toBeNull();
  });

  it("uses default max of 500", () => {
    const longString = "a".repeat(501);
    expect(validateString(longString, "Name")).toBe("Name darf maximal 500 Zeichen lang sein");
    expect(validateString("a".repeat(500), "Name")).toBeNull();
  });

  it("accepts valid strings", () => {
    expect(validateString("Hello", "Name")).toBeNull();
    expect(validateString("A valid name", "Name")).toBeNull();
  });

  it("handles whitespace-only strings with min length", () => {
    expect(validateString("   ", "Name", { min: 1 })).toBe("Name muss mindestens 1 Zeichen lang sein");
  });

  it("handles min=0 correctly (not falsy bug)", () => {
    expect(validateString("", "Name", { required: false, min: 0 })).toBeNull();
    expect(validateString("a", "Name", { min: 0 })).toBeNull();
  });

  it("validates max on trimmed value (not raw)", () => {
    // "  ab  " has raw length 6 but trimmed length 2 → should pass max=3
    expect(validateString("  ab  ", "Name", { max: 3 })).toBeNull();
    expect(validateString("  abcd  ", "Name", { max: 3 })).toBe("Name darf maximal 3 Zeichen lang sein");
  });
});

describe("validateNumber", () => {
  it("returns error for missing required value", () => {
    expect(validateNumber(undefined, "Alter")).toBe("Alter ist erforderlich");
    expect(validateNumber(null, "Alter")).toBe("Alter ist erforderlich");
    expect(validateNumber("", "Alter")).toBe("Alter ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateNumber(undefined, "Alter", { required: false })).toBeNull();
    expect(validateNumber(null, "Alter", { required: false })).toBeNull();
    expect(validateNumber("", "Alter", { required: false })).toBeNull();
  });

  it("returns error for NaN", () => {
    expect(validateNumber("abc", "Alter")).toBe("Alter muss eine Zahl sein");
    expect(validateNumber("not-a-number", "Alter")).toBe("Alter muss eine Zahl sein");
  });

  it("validates minimum value", () => {
    expect(validateNumber(-1, "Alter", { min: 0 })).toBe("Alter muss mindestens 0 sein");
    expect(validateNumber(0, "Alter", { min: 0 })).toBeNull();
    expect(validateNumber(5, "Alter", { min: 0 })).toBeNull();
  });

  it("validates maximum value", () => {
    expect(validateNumber(101, "Alter", { max: 100 })).toBe("Alter darf maximal 100 sein");
    expect(validateNumber(100, "Alter", { max: 100 })).toBeNull();
  });

  it("accepts valid numbers", () => {
    expect(validateNumber(42, "Alter")).toBeNull();
    expect(validateNumber(0, "Alter")).toBeNull();
    expect(validateNumber(-5, "Alter")).toBeNull();
  });

  it("accepts numeric strings", () => {
    expect(validateNumber("42", "Alter")).toBeNull();
    expect(validateNumber("3.14", "Alter")).toBeNull();
  });

  it("handles zero correctly (not falsy bug)", () => {
    expect(validateNumber(0, "Score", { min: 0, max: 100 })).toBeNull();
  });

  it("validates min and max together", () => {
    expect(validateNumber(5, "Score", { min: 1, max: 10 })).toBeNull();
    expect(validateNumber(0, "Score", { min: 1, max: 10 })).toBe("Score muss mindestens 1 sein");
    expect(validateNumber(11, "Score", { min: 1, max: 10 })).toBe("Score darf maximal 10 sein");
  });
});

describe("firstError", () => {
  it("returns null when no errors", () => {
    expect(firstError()).toBeNull();
    expect(firstError(null, null, null)).toBeNull();
  });

  it("returns first error", () => {
    expect(firstError("Error 1", "Error 2")).toBe("Error 1");
  });

  it("skips null values and returns first error", () => {
    expect(firstError(null, "Error 2", "Error 3")).toBe("Error 2");
  });

  it("returns single error", () => {
    expect(firstError(null, null, "Only Error")).toBe("Only Error");
  });
});

describe("validateEmail", () => {
  it("returns error for missing required value", () => {
    expect(validateEmail(undefined)).toBe("E-Mail ist erforderlich");
    expect(validateEmail(null)).toBe("E-Mail ist erforderlich");
    expect(validateEmail("")).toBe("E-Mail ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateEmail(undefined, "E-Mail", { required: false })).toBeNull();
    expect(validateEmail("", "E-Mail", { required: false })).toBeNull();
  });

  it("returns error for invalid email formats", () => {
    expect(validateEmail("notanemail")).toBe("E-Mail ist keine gültige E-Mail-Adresse");
    expect(validateEmail("missing@domain")).toBe("E-Mail ist keine gültige E-Mail-Adresse");
    expect(validateEmail("@domain.com")).toBe("E-Mail ist keine gültige E-Mail-Adresse");
    expect(validateEmail("spaces in@email.com")).toBe("E-Mail ist keine gültige E-Mail-Adresse");
  });

  it("accepts valid email formats", () => {
    expect(validateEmail("user@example.com")).toBeNull();
    expect(validateEmail("user.name@domain.co")).toBeNull();
    expect(validateEmail("  USER@EXAMPLE.COM  ")).toBeNull();
  });

  it("rejects overly long emails", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(validateEmail(longEmail)).toBe("E-Mail ist zu lang");
  });

  it("uses custom field name", () => {
    expect(validateEmail("", "Kontakt-Email")).toBe("Kontakt-Email ist erforderlich");
  });
});

describe("validateUrl", () => {
  it("returns error for missing required value", () => {
    expect(validateUrl(undefined)).toBe("URL ist erforderlich");
    expect(validateUrl("")).toBe("URL ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateUrl(undefined, "URL", { required: false })).toBeNull();
    expect(validateUrl("", "URL", { required: false })).toBeNull();
  });

  it("returns error for invalid URLs", () => {
    expect(validateUrl("not-a-url")).toBe("URL ist keine gültige URL");
    expect(validateUrl("just text")).toBe("URL ist keine gültige URL");
  });

  it("accepts valid URLs", () => {
    expect(validateUrl("https://example.com")).toBeNull();
    expect(validateUrl("http://localhost:3000")).toBeNull();
    expect(validateUrl("https://boardgamegeek.com/boardgame/123")).toBeNull();
  });

  it("rejects disallowed protocols", () => {
    expect(validateUrl("ftp://example.com")).toContain("muss mit");
    expect(validateUrl("javascript:alert(1)")).toContain("muss mit");
  });

  it("allows custom protocols", () => {
    expect(validateUrl("ftp://example.com", "URL", { protocols: ["ftp:"] })).toBeNull();
  });
});

describe("validateDate", () => {
  it("returns error for missing required value", () => {
    expect(validateDate(undefined)).toBe("Datum ist erforderlich");
    expect(validateDate(null)).toBe("Datum ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateDate(undefined, "Datum", { required: false })).toBeNull();
  });

  it("returns error for invalid dates", () => {
    expect(validateDate("not-a-date")).toBe("Datum ist kein gültiges Datum");
    expect(validateDate("2024-13-01")).toBe("Datum ist kein gültiges Datum");
  });

  it("accepts valid date strings", () => {
    expect(validateDate("2024-06-15")).toBeNull();
    expect(validateDate("2024-01-01T12:00:00Z")).toBeNull();
  });

  it("accepts Date objects", () => {
    expect(validateDate(new Date("2024-06-15"))).toBeNull();
  });

  it("validates min/max date boundaries", () => {
    const min = new Date("2024-01-01");
    const max = new Date("2024-12-31");
    expect(validateDate("2023-12-31", "Datum", { min })).toContain("darf nicht vor");
    expect(validateDate("2025-01-01", "Datum", { max })).toContain("darf nicht nach");
    expect(validateDate("2024-06-15", "Datum", { min, max })).toBeNull();
  });
});

describe("validateEnum", () => {
  const allowed = ["draft", "voting", "closed"] as const;

  it("returns error for missing required value", () => {
    expect(validateEnum(undefined, "Status", allowed)).toBe("Status ist erforderlich");
    expect(validateEnum("", "Status", allowed)).toBe("Status ist erforderlich");
  });

  it("returns null for missing optional value", () => {
    expect(validateEnum(undefined, "Status", allowed, { required: false })).toBeNull();
  });

  it("returns error for invalid enum value", () => {
    expect(validateEnum("invalid", "Status", allowed)).toContain("muss einer der folgenden Werte sein");
    expect(validateEnum("DRAFT", "Status", allowed)).toContain("draft, voting, closed");
  });

  it("accepts valid enum values", () => {
    expect(validateEnum("draft", "Status", allowed)).toBeNull();
    expect(validateEnum("voting", "Status", allowed)).toBeNull();
    expect(validateEnum("closed", "Status", allowed)).toBeNull();
  });

  it("returns error for non-string types", () => {
    expect(validateEnum(123, "Status", allowed)).toBe("Status muss ein Text sein");
  });
});
