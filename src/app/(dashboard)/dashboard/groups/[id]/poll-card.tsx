"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Trash2,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { formatDate } from "@/lib/date";
import { SerializedGroupPoll, SerializedGroupPollOption, SerializedGroupPollVote } from "@/types/group";

interface PollCardProps {
  poll: SerializedGroupPoll;
  groupId: string;
  userId: string;
  isOwner: boolean;
  onRefresh: () => void;
}

export function PollCard({ poll, groupId, userId, isOwner, onRefresh }: PollCardProps) {
  const [loading, setLoading] = useState("");
  const [commentText, setCommentText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const userVotedOption = (poll: SerializedGroupPoll) => {
    for (const option of poll.options) {
      const vote = option.votes.find((v: SerializedGroupPollVote) => v.userId === userId);
      if (vote) return option.id;
    }
    return null;
  };

  async function handleVote(pollId: string, optionId: string, _pollType: string) {
    setLoading(`vote-${pollId}`);
    try {
      await fetch(`/api/groups/${groupId}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: [optionId] }),
      });
      onRefresh();
    } finally {
      setLoading("");
    }
  }

  async function handleClosePoll(pollId: string) {
    setLoading(`close-${pollId}`);
    try {
      await fetch(`/api/groups/${groupId}/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      onRefresh();
    } finally {
      setLoading("");
    }
  }

  async function handleDeletePoll(pollId: string) {
    setLoading(`delete-${pollId}`);
    try {
      await fetch(`/api/groups/${groupId}/polls/${pollId}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setLoading("");
    }
  }

  async function handleComment(pollId: string) {
    if (!commentText.trim()) return;
    setLoading(`comment-${pollId}`);
    try {
      await fetch(`/api/groups/${groupId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim(), pollId: pollId }),
      });
      setCommentText("");
      onRefresh();
    } finally {
      setLoading("");
    }
  }

  const totalVotes = poll.options.reduce(
    (sum: number, opt: SerializedGroupPollOption) => sum + opt._count.votes,
    0
  );
  const myVote = userVotedOption(poll);
  const isOpen = poll.status === "open";
  const canManage =
    poll.createdBy?.id === userId || isOwner;

  return (
    <Card className={!isOpen ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
          <div>
            <CardTitle as="h2" className="text-base flex items-center flex-wrap gap-2">
              {poll.title}
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Offen" : "Geschlossen"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {poll.type === "single" ? "Einzelwahl" : "Mehrfachwahl"}
              </Badge>
            </CardTitle>
            {poll.description && (
              <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              von {poll.createdBy?.name} · {formatDate(poll.createdAt)}
              {" · "}{totalVotes} Stimme{totalVotes !== 1 ? "n" : ""}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-1">
              {isOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClosePoll(poll.id)}
                  disabled={loading === `close-${poll.id}`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Schließen
                </Button>
              )}
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Abstimmung löschen"
                    disabled={loading === `delete-${poll.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Abstimmung löschen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchtest du die Abstimmung „{poll.title}“ wirklich löschen?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => setDeleteDialogOpen(false)}>
                      Abbrechen
                    </AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      variant="destructive"
                      disabled={loading === `delete-${poll.id}`}
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        handleDeletePoll(poll.id);
                      }}
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Options with vote bars */}
        {poll.options.map((option: SerializedGroupPollOption) => {
          const voteCount = option._count.votes;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = myVote === option.id;
          const voterNames = option.votes.map((v: SerializedGroupPollVote) => v.voterName).join(", ");

          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              onClick={() => isOpen && handleVote(poll.id, option.id, poll.type)}
              disabled={!isOpen || loading === `vote-${poll.id}`}
              className={`w-full h-auto flex flex-col items-stretch justify-start gap-0 p-3 rounded-lg border font-normal text-left whitespace-normal transition-colors ${
                isMyVote
                  ? "border-primary bg-primary/5 hover:bg-primary/5 hover:text-foreground"
                  : "border-border hover:border-primary/50 hover:bg-transparent hover:text-foreground"
              } ${!isOpen ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-1 w-full">
                <span className="text-sm font-medium flex items-center gap-2">
                  {option.text}
                  {isMyVote && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {voteCount} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {voterNames && (
                <p className="text-xs text-muted-foreground mt-1 w-full">{voterNames}</p>
              )}
            </Button>
          );
        })}

        {/* Poll Comments */}
        {poll._count.comments > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {poll._count.comments} Kommentar{poll._count.comments !== 1 ? "e" : ""}
            </p>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Kommentar zur Abstimmung…"
            aria-label="Kommentar zur Abstimmung"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment(poll.id)}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleComment(poll.id)}
            disabled={loading === `comment-${poll.id}`}
            aria-label="Kommentar senden"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
