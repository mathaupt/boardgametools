export type Availability = "yes" | "maybe" | "no";
export type ParticipantKind = "user" | "guest";
export type ParticipantAnswerState = "answered" | "unanswered" | "unknown";

export interface DateAvailabilityParticipant {
  key: string;
  displayName: string;
  kind: ParticipantKind;
  answer: Availability | null;
  state: ParticipantAnswerState;
}

export interface DateAvailabilityProposal {
  id: string;
  date: string;
  votes: Array<{
    id: string;
    availability: string;
    user: { id: string; name: string | null };
  }>;
  guestVotes: Array<{
    id: string;
    availability: string;
    guest: { id: string; nickname: string };
  }>;
}

export interface DateAvailabilitySummary {
  counts: { yes: number; maybe: number; no: number; unanswered: number; unknown: number };
  participants: DateAvailabilityParticipant[];
  myAvailability: Availability | null;
  myAnswerUnknown: boolean;
}

export interface KnownDateParticipant {
  id: string;
  displayName: string;
  kind: ParticipantKind;
}

export function normalizeAvailability(value: string): Availability | null {
  return value === "yes" || value === "maybe" || value === "no" ? value : null;
}

export function collectDateParticipants(
  proposals: readonly DateAvailabilityProposal[],
  knownParticipants: readonly KnownDateParticipant[] = [],
): Array<Pick<DateAvailabilityParticipant, "key" | "displayName" | "kind">> {
  const participants = new Map<string, Pick<DateAvailabilityParticipant, "key" | "displayName" | "kind">>();

  for (const proposal of proposals) {
    for (const vote of proposal.votes) {
      const key = `user:${vote.user.id}`;
      if (!participants.has(key)) {
        participants.set(key, {
          key,
          displayName: vote.user.name?.trim() || "Teilnehmer",
          kind: "user",
        });
      }
    }
    for (const vote of proposal.guestVotes) {
      const key = `guest:${vote.guest.id}`;
      if (!participants.has(key)) {
        participants.set(key, {
          key,
          displayName: vote.guest.nickname.trim() || "Gast",
          kind: "guest",
        });
      }
    }
  }

  for (const participant of knownParticipants) {
    const key = `${participant.kind}:${participant.id}`;
    if (!participants.has(key)) {
      participants.set(key, {
        key,
        displayName: participant.displayName.trim() || (participant.kind === "guest" ? "Gast" : "Teilnehmer"),
        kind: participant.kind,
      });
    }
  }

  return Array.from(participants.values());
}

export function summarizeDateAvailability(
  proposal: DateAvailabilityProposal,
  knownParticipants: readonly Pick<DateAvailabilityParticipant, "key" | "displayName" | "kind">[],
  activeParticipantKey: string | null,
): DateAvailabilitySummary {
  const responses = new Map<string, string>();
  for (const vote of proposal.votes) responses.set(`user:${vote.user.id}`, vote.availability);
  for (const vote of proposal.guestVotes) responses.set(`guest:${vote.guest.id}`, vote.availability);

  const participantMap = new Map(knownParticipants.map((participant) => [participant.key, participant]));
  if (activeParticipantKey && !participantMap.has(activeParticipantKey)) {
    const isGuest = activeParticipantKey.startsWith("guest:");
    participantMap.set(activeParticipantKey, {
      key: activeParticipantKey,
      displayName: "Du",
      kind: isGuest ? "guest" : "user",
    });
  }

  const participants = Array.from(participantMap.values()).map((participant) => {
    const rawAnswer = responses.get(participant.key);
    const answer = rawAnswer === undefined ? null : normalizeAvailability(rawAnswer);
    return {
      ...participant,
      answer,
      state: rawAnswer === undefined ? "unanswered" : answer === null ? "unknown" : "answered",
    } satisfies DateAvailabilityParticipant;
  });

  const counts = {
    yes: 0,
    maybe: 0,
    no: 0,
    unanswered: 0,
    unknown: 0,
  };
  for (const participant of participants) {
    if (participant.state === "unanswered") counts.unanswered += 1;
    else if (participant.state === "unknown") counts.unknown += 1;
    else if (participant.answer) counts[participant.answer] += 1;
  }

  const activeParticipant = participants.find(({ key }) => key === activeParticipantKey);
  return {
    counts,
    participants,
    myAvailability: activeParticipant?.answer ?? null,
    myAnswerUnknown: activeParticipant?.state === "unknown",
  };
}
