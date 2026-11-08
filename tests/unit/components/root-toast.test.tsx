import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/font/google", () => ({ Barlow: () => ({ variable: "font-barlow" }), Geist_Mono: () => ({ variable: "font-mono" }) }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));
import RootLayout from "@/app/layout";
import { useToast } from "@/components/ui/use-toast";
function Trigger() { const { toast } = useToast(); return <button onClick={() => toast({ title: "Beitritt fehlgeschlagen", description: "Bitte erneut versuchen." })}>Fehler auslösen</button>; }
afterEach(cleanup);
it("renders application feedback from the shared toast store", async () => {
  const user = userEvent.setup();
  render(<RootLayout><Trigger /></RootLayout>, { container: document });
  await user.click(screen.getByRole("button", { name: "Fehler auslösen" }));
  expect(await screen.findByText("Beitritt fehlgeschlagen")).toBeInTheDocument();
  expect(screen.getByText("Bitte erneut versuchen.")).toBeInTheDocument();
});
