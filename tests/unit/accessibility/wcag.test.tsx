import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// ── Mocks ──────────────────────────────────────────────────────
const { mockPush, mockRefresh, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

// ── Imports (after mocks) ─────────────────────────────────────
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── WCAG 2.1 AA Tests ────────────────────────────────────────
describe("WCAG Accessibility (axe-core)", () => {
  it("Login page has no accessibility violations", async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Register page has no accessibility violations", async () => {
    const { container } = render(<RegisterPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("WCAG structural checks", () => {
  it("Login form has associated labels for all inputs", () => {
    const { container } = render(<LoginPage />);
    const inputs = container.querySelectorAll("input:not([type='hidden'])");
    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      expect(id).toBeTruthy();
      const label = container.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");
      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
    });
  });

  it("Register form has associated labels for all inputs", () => {
    const { container } = render(<RegisterPage />);
    const inputs = container.querySelectorAll("input:not([type='hidden'])");
    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      expect(id).toBeTruthy();
      const label = container.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");
      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
    });
  });

  it("interactive elements have minimum touch target size hinting", () => {
    const { container } = render(<LoginPage />);
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      // Button should have padding or min-h classes (proxy for 44px touch target)
      const classes = btn.className;
      const hasSizing = classes.includes("h-") || classes.includes("py-") || classes.includes("p-") || classes.includes("min-h");
      expect(hasSizing).toBe(true);
    });
  });

  it("color contrast: no text-gray without sufficient contrast class", () => {
    const { container } = render(<LoginPage />);
    const allElements = container.querySelectorAll("*");
    allElements.forEach((el) => {
      const classes = el.className;
      if (typeof classes !== "string") return;
      // text-muted-foreground uses CSS variable which is WCAG compliant
      // Only flag raw low-contrast utilities like text-gray-300/400
      const lowContrast = /text-gray-[23]00/.test(classes);
      expect(lowContrast).toBe(false);
    });
  });
});
