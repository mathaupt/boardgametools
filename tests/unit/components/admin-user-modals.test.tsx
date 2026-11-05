import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordModal } from "@/components/admin/change-password-modal";
import { DeactivateUserModal } from "@/components/admin/deactivate-user-modal";

const props = { isOpen: true, onClose: vi.fn(), userId: "u1", userName: "Alex", userEmail: "alex@example.test" };
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); vi.stubGlobal("fetch", vi.fn()); });

describe("ChangePasswordModal", () => {
  it("validates matching and minimum password length and toggles visibility", async () => {
    const user = userEvent.setup(); render(<ChangePasswordModal {...props} />);
    const form = screen.getByRole("button", { name: "Passwort ändern" }).closest("form")!;
    await user.type(screen.getByLabelText("Neues Passwort"), "short");
    await user.type(screen.getByLabelText("Passwort bestätigen"), "different");
    fireEvent.submit(form);
    expect(await screen.findByText("Passwörter stimmen nicht überein")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Passwort bestätigen")); await user.type(screen.getByLabelText("Passwort bestätigen"), "short");
    fireEvent.submit(form);
    expect(await screen.findByText("Passwort muss mindestens 8 Zeichen lang sein")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Passwort anzeigen" })[0]);
    expect(screen.getByLabelText("Neues Passwort")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Passwort bestätigen")).toHaveAttribute("type", "text");
    await user.click(screen.getAllByRole("button", { name: "Passwort verbergen" })[0]);
    expect(screen.getByLabelText("Neues Passwort")).toHaveAttribute("type", "password");
  });

  it("shows API and network errors, then closes and clears fields on success", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Passwort nicht zulässig" }, { status: 400 }))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(Response.json({ success: true }));
    const user = userEvent.setup(); render(<ChangePasswordModal {...props} />);
    await user.type(screen.getByLabelText("Neues Passwort"), "password1");
    await user.type(screen.getByLabelText("Passwort bestätigen"), "password1");
    await user.click(screen.getByRole("button", { name: "Passwort ändern" }));
    expect(await screen.findByText("Passwort nicht zulässig")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Passwort ändern" }));
    expect(await screen.findByText("Ein Fehler ist aufgetreten")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Passwort ändern" }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/change-password", expect.objectContaining({ body: JSON.stringify({ userId: "u1", newPassword: "password1" }) }));
  });
});

describe("DeactivateUserModal", () => {
  it("shows both status labels and toggles the active flag on successful updates", async () => {
    const fetchMock = vi.mocked(fetch); fetchMock.mockResolvedValue(Response.json({ success: true }));
    const reload = vi.fn(); Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
    const user = userEvent.setup(); const { rerender } = render(<DeactivateUserModal {...props} isActive />);
    expect(screen.getByText(/wirklich deaktivieren/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deaktivieren" }));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/users/deactivate", expect.objectContaining({ body: JSON.stringify({ userId: "u1", isActive: false }) }));
    expect(reload).toHaveBeenCalledOnce();
    rerender(<DeactivateUserModal {...props} isActive={false} />);
    expect(screen.getByText(/wirklich aktivieren/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aktivieren" }));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/users/deactivate", expect.objectContaining({ body: JSON.stringify({ userId: "u1", isActive: true }) }));
  });

  it("shows server and network errors without reloading", async () => {
    const reload = vi.fn(); Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: "Status gesperrt" }, { status: 403 })).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup(); render(<DeactivateUserModal {...props} isActive />);
    await user.click(screen.getByRole("button", { name: "Deaktivieren" }));
    expect(await screen.findByText("Status gesperrt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deaktivieren" }));
    expect(await screen.findByText("Ein Fehler ist aufgetreten")).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
