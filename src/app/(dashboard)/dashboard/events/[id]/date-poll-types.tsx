import { Check, HelpCircle, X } from "lucide-react";

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

export function getAvailabilityIcon(availability: string) {
  switch (availability) {
    case "yes":
      return <Check className="h-4 w-4 text-success" />;
    case "maybe":
      return <HelpCircle className="h-4 w-4 text-warning" />;
    case "no":
      return <X className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
}

export function getAvailabilityColor(availability: string) {
  switch (availability) {
    case "yes":
      return "bg-success/10 text-success border-success/50";
    case "maybe":
      return "bg-warning/10 text-warning border-warning/50";
    case "no":
      return "bg-destructive/10 text-destructive border-destructive/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function countAvailability(proposal: DateProposal) {
  const all = [
    ...proposal.votes.map((v) => v.availability),
    ...proposal.guestVotes.map((v) => v.availability),
  ];
  return {
    yes: all.filter((a) => a === "yes").length,
    maybe: all.filter((a) => a === "maybe").length,
    no: all.filter((a) => a === "no").length,
    total: all.length,
  };
}
