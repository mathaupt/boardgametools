import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateAvailabilityGroup } from "@/components/event-voting/date-availability-group";

const renderGroup = (overrides: Partial<Parameters<typeof DateAvailabilityGroup>[0]> = {}) => {
  const onChange = vi.fn();
  render(
    <DateAvailabilityGroup
      idPrefix="public"
      dateProposalId="date-1"
      dateLabel="Freitag, 6. November 2026"
      value="maybe"
      disabled={false}
      busy={false}
      onChange={onChange}
      {...overrides}
    />,
  );
  return onChange;
};

describe("DateAvailabilityGroup", () => {
  it("exposes the date as a group name and keeps the saved response selected", () => {
    renderGroup();

    expect(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Vielleicht" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("sends the selected answer through its controlled callback", async () => {
    const user = userEvent.setup();
    const onChange = renderGroup({ value: null });

    await user.click(screen.getByRole("radio", { name: "Nein" }));

    expect(onChange).toHaveBeenCalledWith("no");
  });

  it("supports native radio keyboard navigation", async () => {
    const user = userEvent.setup();
    const onChange = renderGroup();

    await user.tab();
    expect(screen.getByRole("radio", { name: "Vielleicht" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("no");
  });

  it("does not preselect an answer when no response is saved", () => {
    renderGroup({ value: null });

    expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it("keeps controls in the DOM and prevents duplicate changes while saving", async () => {
    const user = userEvent.setup();
    const onChange = renderGroup({ busy: true });
    const radios = screen.getAllByRole("radio");

    expect(screen.getByRole("group")).toHaveAttribute("aria-busy", "true");
    expect(radios.every((radio) => !radio.hasAttribute("disabled"))).toBe(true);
    await user.click(screen.getByRole("radio", { name: "Nein" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every answer when the event state blocks voting", () => {
    renderGroup({ disabled: true });

    expect(screen.getAllByRole("radio").every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
  });

  it("uses separate radio names for different dates", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <>
        <DateAvailabilityGroup idPrefix="private" dateProposalId="date-1" dateLabel="Termin 1" value={null} disabled={false} busy={false} onChange={onChange} />
        <DateAvailabilityGroup idPrefix="private" dateProposalId="date-2" dateLabel="Termin 2" value={null} disabled={false} busy={false} onChange={onChange} />
      </>,
    );
    const names = Array.from(screen.getAllByRole("radio"), (radio) => radio.getAttribute("name"));

    expect(new Set(names)).toEqual(new Set(["private-date-1", "private-date-2"]));
    rerender(<DateAvailabilityGroup idPrefix="private" dateProposalId="date-1" dateLabel="Termin 1" value="yes" disabled={false} busy={false} onChange={onChange} />);
    expect(screen.getByRole("radio", { name: "Ja" })).toBeChecked();
  });
});
