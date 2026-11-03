import { describe, expect, it } from "vitest";
import { canDeleteEventProposal } from "@/lib/events/event-proposal-permissions";

describe("canDeleteEventProposal", () => {
  it("allows the event creator to delete any proposal", () => {
    expect(canDeleteEventProposal({ createdById: "creator", userId: "creator", proposedById: "other" })).toBe(true);
  });

  it("allows a proposer to delete their own proposal", () => {
    expect(canDeleteEventProposal({ createdById: "creator", userId: "other", proposedById: "other" })).toBe(true);
  });

  it("denies other event participants", () => {
    expect(canDeleteEventProposal({ createdById: "creator", userId: "guest", proposedById: "other" })).toBe(false);
  });
});
