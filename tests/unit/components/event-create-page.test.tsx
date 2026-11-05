import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ push: vi.fn(), toast: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));

import NewEventPage from "@/app/(dashboard)/dashboard/events/new/page";

describe("NewEventPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.fetch.mockResolvedValue(Response.json({ id: "event-1" }, { status: 201 }));
  });

  it("sends the chosen event duration together with the local start time", async () => {
    render(<NewEventPage />);
    fireEvent.change(screen.getByLabelText(/Event Titel/), { target: { value: "Spielabend" } });
    fireEvent.change(screen.getByLabelText(/Datum/), { target: { value: "2026-11-20T19:00" } });
    fireEvent.change(screen.getByLabelText("Dauer"), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: /Event erstellen/i }));

    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    const payload = JSON.parse(mocks.fetch.mock.calls[0][1].body as string);
    expect(payload.eventDate).toBe(new Date("2026-11-20T19:00").toISOString());
    expect(payload.durationMinutes).toBe(120);
  });
});
