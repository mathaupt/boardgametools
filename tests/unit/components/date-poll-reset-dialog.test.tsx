import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PollClosedBanner } from "@/app/(dashboard)/dashboard/events/[id]/date-poll-reset-dialog";

describe("PollClosedBanner", () => {
  it("announces the chosen date with readable status text and a touch-sized reset action", () => {
    render(
      <PollClosedBanner
        finalDate="2026-11-06T00:00:00.000Z"
        canReset={true}
        resetting={false}
        onResetClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Die Terminabstimmung ist abgeschlossen.");
    expect(screen.getByRole("status")).toHaveClass("text-foreground");
    expect(screen.getByRole("button", { name: "Neue Terminabstimmung starten" })).toHaveClass("min-h-11");
  });
});
