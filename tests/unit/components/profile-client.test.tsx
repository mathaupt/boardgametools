import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileClient } from "@/app/(dashboard)/dashboard/profile/profile-client";

vi.mock("@/app/(dashboard)/dashboard/profile/profile-edit-form", () => ({ ProfileEditForm: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/password-change-form", () => ({ PasswordChangeForm: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/profile-activity-cards", () => ({ ProfileActivityCards: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/profile-messages-card", () => ({ ProfileMessagesCard: () => null }));
vi.mock("@/app/(dashboard)/dashboard/profile/public-profile-settings", () => ({ PublicProfileSettings: () => null }));

describe("ProfileClient", () => {
  it("offers the private badge catalogue directly from the profile", () => {
    render(
      <ProfileClient
        user={{ id: "user-1", name: "Alex", email: "alex@example.test", role: "USER", createdAt: "2026-01-01T00:00:00.000Z" }}
        invites={[]}
        events={[]}
        groups={[]}
        comments={[]}
        sessionNotes={[]}
      />
    );

    expect(screen.getByRole("link", { name: /Alle Abzeichen und ihre Freischaltbedingungen ansehen/i }))
      .toHaveAttribute("href", "/dashboard/achievements");
  });
});
