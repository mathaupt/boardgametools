"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, MessageSquare } from "lucide-react";
import type { GroupPoll, GroupPollOption } from "./public-group-types";

interface PublicPollCardProps {
  poll: GroupPoll;
  voterName: string;
  nameSet: boolean;
  loading: string;
  pollComment: string;
  onPollCommentChange: (value: string) => void;
  onVote: (pollId: string, optionId: string) => void;
  onComment: (pollId: string) => void;
}

export default function PublicPollCard({
  poll,
  voterName,
  nameSet,
  loading,
  pollComment,
  onPollCommentChange,
  onVote,
  onComment,
}: PublicPollCardProps) {
  const totalVotes = poll.options.reduce(
    (sum: number, opt: GroupPollOption) => sum + (opt._count?.votes || opt.votes?.length || 0),
    0
  );
  const isOpen = poll.status === "open";
  const myVote = poll.options.find((o) =>
    o.votes?.some((v) => v.voterName === voterName.trim())
  )?.id;

  return (
    <Card className={!isOpen ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {poll.title}
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Offen" : "Geschlossen"}
          </Badge>
        </CardTitle>
        {poll.description && (
          <p className="text-sm text-muted-foreground">{poll.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          von {poll.createdBy?.name} · {totalVotes} Stimme{totalVotes !== 1 ? "n" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map((option) => {
          const voteCount = option._count?.votes || option.votes?.length || 0;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = myVote === option.id;
          const voterNames = option.votes?.map((v) => v.voterName).join(", ") || "";

          return (
            <button
              key={option.id}
              onClick={() => isOpen && nameSet && onVote(poll.id, option.id)}
              disabled={!isOpen || !nameSet || loading === `vote-${poll.id}`}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isMyVote
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${!isOpen || !nameSet ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  {option.text}
                  {isMyVote && <Check className="h-3 w-3 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">
                  {voteCount} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {voterNames && (
                <p className="text-xs text-muted-foreground mt-1">{voterNames}</p>
              )}
            </button>
          );
        })}

        {/* Poll Comments */}
        {poll.comments && poll.comments.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {poll.comments.map((c) => (
              <div key={c.id} className="p-2 rounded bg-muted/30 text-sm">
                <span className="font-medium">{c.authorName}:</span>{" "}
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            ))}
          </div>
        )}

        {nameSet && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Kommentar..."
              value={pollComment}
              onChange={(e) => onPollCommentChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onComment(poll.id)}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComment(poll.id)}
              disabled={loading === `comment-${poll.id}`}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
