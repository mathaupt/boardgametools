import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateCreateForm } from "@/app/(dashboard)/dashboard/events/[id]/date-poll-create-form";

describe("DateCreateForm", () => {
  it("gives date fields, weekday options, and the primary action touch-sized targets", () => {
    render(
      <DateCreateForm
        startDate=""
        endDate=""
        selectedWeekdays={[]}
        loading={false}
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        onToggleWeekday={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Von")).toHaveClass("min-h-11");
    expect(screen.getByLabelText("Bis")).toHaveClass("min-h-11");
    expect(screen.getByText("Mo").closest("label")).toHaveClass("min-h-11");
    expect(screen.getByRole("button", { name: "Termine erstellen" })).toHaveClass("min-h-11");
  });
});
