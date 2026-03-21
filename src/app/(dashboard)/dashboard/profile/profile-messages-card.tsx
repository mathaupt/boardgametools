"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Gamepad2, ChevronDown, ChevronUp } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  groupId: string;
  groupName: string;
  pollId: string | null;
  pollTitle: string | null;
}

interface SessionNote {
  id: string;
  notes: string;
  playedAt: string;
  gameId: string;
  gameName: string;
}

interface ProfileMessagesCardProps {
  comments: CommentItem[];
  sessionNotes: SessionNote[];
}

export function ProfileMessagesCard({ comments, sessionNotes }: ProfileMessagesCardProps) {
  const [commOpen, setCommOpen] = useState(false);

  if (comments.length === 0 && sessionNotes.length === 0) return null;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setCommOpen(!commOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/30 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-base font-semibold">Meine Nachrichten</span>
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {comments.length + sessionNotes.length}
          </span>
        </div>
        {commOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {commOpen && (
        <CardContent className="pt-0 space-y-6">
          {/* Gruppen-Kommentare */}
          {comments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Gruppen-Kommentare ({comments.length})
              </h3>
              <ul className="divide-y divide-border">
                {comments.map((c) => (
                  <li key={c.id} className="py-3">
                    <Link
                      href={`/dashboard/groups/${c.groupId}`}
                      className="block rounded-md transition-colors hover:bg-muted/50 -mx-2 px-2 py-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 shrink-0 mt-0.5">
                          <MessageSquare className="h-3.5 w-3.5 text-info" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">{c.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            in <span className="font-medium text-foreground">{c.groupName}</span>
                            {c.pollTitle && (
                              <> &middot; Umfrage: &ldquo;{c.pollTitle}&rdquo;</>
                            )}
                            {" · "}
                            {new Date(c.createdAt).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Session-Notizen */}
          {sessionNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Gamepad2 className="h-3.5 w-3.5" />
                Session-Notizen ({sessionNotes.length})
              </h3>
              <ul className="divide-y divide-border">
                {sessionNotes.map((s) => (
                  <li key={s.id} className="py-3">
                    <Link
                      href={`/dashboard/sessions`}
                      className="block rounded-md transition-colors hover:bg-muted/50 -mx-2 px-2 py-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                          <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">{s.notes}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{s.gameName}</span>
                            {" · "}
                            {new Date(s.playedAt).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
