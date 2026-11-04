export interface ChallengeParticipantInterval {
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface ChallengeSessionRecord {
  id: string;
  gameId: string;
  createdById: string;
  createdAt: Date;
  playerIds: string[];
}

export function aggregateChallengeProgress(
  sessions: readonly ChallengeSessionRecord[],
  participants: readonly ChallengeParticipantInterval[],
  startsAt: Date,
  endsAt: Date | null,
  kind: "sessions" | "games",
): number {
  const eligibleIds = new Set<string>();
  for (const participant of participants) {
    for (const session of sessions) {
      const timestamp = session.createdAt.getTime();
      if (timestamp < startsAt.getTime() || (endsAt && timestamp > endsAt.getTime())) continue;
      if (timestamp < participant.joinedAt.getTime() || (participant.leftAt && timestamp > participant.leftAt.getTime())) continue;
      if (session.createdById === participant.userId || session.playerIds.includes(participant.userId)) eligibleIds.add(kind === "sessions" ? session.id : session.gameId);
    }
  }
  return eligibleIds.size;
}
