import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicEventStateBadge } from "@/components/public-event/public-event-state-badge";

describe("PublicEventStateBadge", () => {
  it("uses the semantic warning foreground and enough vertical padding", () => {
    render(<PublicEventStateBadge label="Abstimmung geschlossen" />);

    const badge = screen.getByText("Abstimmung geschlossen");
    expect(badge).toHaveClass("text-warning-foreground");
    expect(badge).toHaveClass("py-1");
  });
});
