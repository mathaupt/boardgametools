export type DateVote = {
  id: string;
  availability: string;
  user: { id: string; name: string; email: string };
};

export type GuestDateVote = {
  id: string;
  availability: string;
  guest: { id: string; nickname: string };
};

export type DateProposal = {
  id: string;
  date: string;
  votes: DateVote[];
  guestVotes: GuestDateVote[];
};

export const WEEKDAY_LABELS = [
  { value: 0, label: "So" },
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
];
