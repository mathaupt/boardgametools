import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Link from "@/components/speech/speech-page-link";
vi.mock("next/link", () => ({ default: (props: React.ComponentProps<"a">) => <a {...props} data-client-navigation="true" /> }));
afterEach(cleanup);
it("loads speech-enabled documents through native links, including collection query strings", () => {
  render(<><Link href="/dashboard/games?q=Azul">Sammlung</Link><Link href="/dashboard/sessions/new">Neue Session</Link><Link href="/dashboard/events">Events</Link></>);
  expect(screen.getByRole("link", { name: "Sammlung" })).not.toHaveAttribute("data-client-navigation");
  expect(screen.getByRole("link", { name: "Neue Session" })).not.toHaveAttribute("data-client-navigation");
  expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute("data-client-navigation", "true");
});
