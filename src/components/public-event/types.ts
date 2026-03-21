import { SerializedPublicEvent } from "@/lib/public-event";

export type Proposal = SerializedPublicEvent["proposals"][number];
export type Guest = SerializedPublicEvent["guestParticipants"][number];
export type DateProposal = SerializedPublicEvent["dateProposals"][number];

export interface StoredGuestState {
  id: string;
  nickname: string;
  votes?: string[];
}

export interface GameSummary {
  id: string;
  name: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity?: number | null;
  imageUrl?: string | null;
}
