import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicIdentityNotice } from "@/components/public-event/public-identity-notice";

describe("PublicIdentityNotice", () => {
  it("shows the active account name without exposing account contact details", () => {
    render(<PublicIdentityNotice actor={{ kind: "user", userId: "u1", displayName: "Anna" }} />);
    expect(screen.getByText("Du bist angemeldet als Anna.")).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("shows the guest nickname and keeps observer/loading states distinct", () => {
    const { rerender } = render(<PublicIdentityNotice actor={{ kind: "guest", guestId: "g1", nickname: "Mia" }} />);
    expect(screen.getByText("Du nimmst als Gast Mia teil.")).toBeInTheDocument();
    rerender(<PublicIdentityNotice actor={{ kind: "loading" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Teilnahme wird geladen");
    rerender(<PublicIdentityNotice actor={{ kind: "observer" }} />);
    expect(screen.getByText(/Du kannst als Gast teilnehmen/)).toBeInTheDocument();
  });

  it("explains an expired account without offering a guest switch", () => {
    render(<PublicIdentityNotice actor={{ kind: "observer" }} sessionExpired />);
    expect(screen.getByText(/Deine Anmeldung ist abgelaufen/)).toBeInTheDocument();
    expect(screen.queryByText(/als Gast teilnehmen/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "melde dich erneut an" })).toHaveAttribute("href", "/login");
  });
});
