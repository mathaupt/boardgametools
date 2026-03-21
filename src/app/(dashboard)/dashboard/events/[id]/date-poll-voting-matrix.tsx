"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  HelpCircle,
  X,
  Crown,
  Loader2,
} from "lucide-react";
import {
  DateProposal,
  getAvailabilityIcon,
  getAvailabilityColor,
  countAvailability,
} from "./date-poll-types";

export function DateVotingMatrix({
  proposals,
  allUsers,
  allGuests,
  userId,
  isPast,
  selectedDate,
  votingLoading,
  selectingDate,
  isCreator,
  onVote,
  onSelectDate,
  getUserVote,
}: {
  proposals: DateProposal[];
  allUsers: Map<string, string>;
  allGuests: Map<string, string>;
  userId: string | null;
  isPast: boolean;
  selectedDate: string | null;
  votingLoading: string | null;
  selectingDate: string | null;
  isCreator: boolean;
  onVote: (dateProposalId: string, availability: string) => void;
  onSelectDate: (dateProposalId: string) => void;
  getUserVote: (proposal: DateProposal) => string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 min-w-[140px]">Datum</th>
            {Array.from(allUsers).map(([id, name]) => (
              <th key={id} className="text-center p-2 min-w-[80px]">
                <span className="text-xs font-medium">{name}</span>
              </th>
            ))}
            {Array.from(allGuests).map(([id, nickname]) => (
              <th key={id} className="text-center p-2 min-w-[80px]">
                <span className="text-xs font-medium text-muted-foreground">
                  {nickname} (Gast)
                </span>
              </th>
            ))}
            <th className="text-center p-2 min-w-[60px]">Summe</th>
            {userId && !isPast && (
              <th className="text-center p-2 min-w-[150px]">Deine Stimme</th>
            )}
            {isCreator && !isPast && (
              <th className="text-center p-2 min-w-[80px]">Auswählen</th>
            )}
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => {
            const d = new Date(proposal.date);
            const counts = countAvailability(proposal);
            const myVote = getUserVote(proposal);
            const isSelected =
              selectedDate &&
              new Date(selectedDate).toDateString() === d.toDateString();

            return (
              <tr
                key={proposal.id}
                className={`border-b hover:bg-muted/30 ${
                  isSelected ? "bg-success/10" : ""
                }`}
              >
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Crown className="h-4 w-4 text-success" />
                    )}
                    <div>
                      <div className="font-medium">
                        {d.toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.toLocaleDateString("de-DE", {
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </td>

                {/* User votes */}
                {Array.from(allUsers).map(([uid]) => {
                  const vote = proposal.votes.find(
                    (v) => v.user.id === uid
                  );
                  return (
                    <td key={uid} className="text-center p-2">
                      {vote ? (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${getAvailabilityColor(
                            vote.availability
                          )}`}
                        >
                          {getAvailabilityIcon(vote.availability)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}

                {/* Guest votes */}
                {Array.from(allGuests).map(([gid]) => {
                  const vote = proposal.guestVotes.find(
                    (v) => v.guest.id === gid
                  );
                  return (
                    <td key={gid} className="text-center p-2">
                      {vote ? (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${getAvailabilityColor(
                            vote.availability
                          )}`}
                        >
                          {getAvailabilityIcon(vote.availability)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}

                {/* Counts */}
                <td className="text-center p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-success/10 text-success"
                    >
                      {counts.yes}
                    </Badge>
                    {counts.maybe > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-warning/10 text-warning"
                      >
                        {counts.maybe}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* User voting buttons */}
                {userId && !isPast && (
                  <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                      {votingLoading === proposal.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              onVote(proposal.id, "yes")
                            }
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              myVote === "yes"
                                ? "border-success bg-success/10"
                                : "border-border hover:border-success/50"
                            }`}
                            title="Ja, passt"
                            aria-label="Ja, passt"
                          >
                            <Check className="h-4 w-4 text-success" />
                          </button>
                          <button
                            onClick={() =>
                              onVote(proposal.id, "maybe")
                            }
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              myVote === "maybe"
                                ? "border-warning bg-warning/10"
                                : "border-border hover:border-warning/50"
                            }`}
                            title="Vielleicht"
                            aria-label="Vielleicht"
                          >
                            <HelpCircle className="h-4 w-4 text-warning" />
                          </button>
                          <button
                            onClick={() =>
                              onVote(proposal.id, "no")
                            }
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              myVote === "no"
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-destructive/50"
                            }`}
                            title="Nein, geht nicht"
                            aria-label="Nein, geht nicht"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}

                {/* Select button for creator */}
                {isCreator && !isPast && (
                  <td className="text-center p-2">
                    {isSelected ? (
                      <Badge className="bg-success">Gewählt</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectDate(proposal.id)}
                        disabled={selectingDate === proposal.id}
                      >
                        {selectingDate === proposal.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Crown className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
