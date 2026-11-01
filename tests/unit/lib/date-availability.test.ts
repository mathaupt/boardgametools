import { describe, expect, it } from "vitest";
import {
  collectDateParticipants,
  summarizeDateAvailability,
  type DateAvailabilityProposal,
} from "@/lib/events/date-availability";

const proposal = (
  id: string,
  votes: DateAvailabilityProposal["votes"] = [],
  guestVotes: DateAvailabilityProposal["guestVotes"] = [],
): DateAvailabilityProposal => ({ id, date: "2026-11-06T00:00:00.000Z", votes, guestVotes });

describe("date availability model", () => {
  it("counts each registered participant and guest once, including unanswered and unknown answers", () => {
    const first = proposal("first", [
      { id: "v1", availability: "yes", user: { id: "u1", name: "Ada" } },
      { id: "v2", availability: "legacy", user: { id: "u2", name: "Lin" } },
    ], [
      { id: "g1", availability: "maybe", guest: { id: "g1", nickname: "Kai" } },
    ]);
    const second = proposal("second", [
      { id: "v3", availability: "no", user: { id: "u1", name: "Ada" } },
    ]);
    const participants = collectDateParticipants([first, second]);

    expect(participants).toHaveLength(3);
    expect(summarizeDateAvailability(first, participants, "user:u1")).toEqual({
      counts: { yes: 1, maybe: 1, no: 0, unanswered: 0, unknown: 1 },
      participants: [
        { key: "user:u1", displayName: "Ada", kind: "user", answer: "yes", state: "answered" },
        { key: "user:u2", displayName: "Lin", kind: "user", answer: null, state: "unknown" },
        { key: "guest:g1", displayName: "Kai", kind: "guest", answer: "maybe", state: "answered" },
      ],
      myAvailability: "yes",
      myAnswerUnknown: false,
    });
  });

  it("keeps a known participant without a response separate from an unknown legacy value", () => {
    const first = proposal("first", [
      { id: "v1", availability: "legacy", user: { id: "u1", name: null } },
    ]);
    const second = proposal("second", [
      { id: "v2", availability: "maybe", user: { id: "u2", name: "Sam" } },
    ]);
    const participants = collectDateParticipants([first, second]);

    expect(summarizeDateAvailability(first, participants, "user:u2")).toMatchObject({
      counts: { unanswered: 1, unknown: 1 },
      myAvailability: null,
      myAnswerUnknown: false,
      participants: [
        { key: "user:u1", displayName: "Teilnehmer", state: "unknown" },
        { key: "user:u2", displayName: "Sam", state: "unanswered" },
      ],
    });
  });

  it("counts the active participant as unanswered before their first response", () => {
    const emptyProposal = proposal("first");

    expect(summarizeDateAvailability(emptyProposal, [], "user:u1")).toMatchObject({
      counts: { yes: 0, maybe: 0, no: 0, unanswered: 1, unknown: 0 },
      participants: [{ key: "user:u1", displayName: "Du", state: "unanswered" }],
      myAvailability: null,
      myAnswerUnknown: false,
    });
  });

  it("includes registered guests who have not responded on any proposed date", () => {
    expect(collectDateParticipants([], [
      { id: "guest-2", displayName: "Jo", kind: "guest" as const },
    ])).toEqual([
      { key: "guest:guest-2", displayName: "Jo", kind: "guest" },
    ]);
  });
});
