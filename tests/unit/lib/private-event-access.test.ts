import { describe, expect, it } from "vitest";
import { privateEventAccessFilter } from "@/lib/private-event-access";

describe("privateEventAccessFilter", () => {
  it("limits page queries to the event creator or one of its invitees", () => {
    expect(privateEventAccessFilter("user-42")).toEqual({
      OR: [
        { createdById: "user-42" },
        { invites: { some: { userId: "user-42" } } },
      ],
    });
  });
});
