import { describe, it, expect } from "vitest";
import { validateString, validateNumber, firstError } from "@/lib/validation";

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
