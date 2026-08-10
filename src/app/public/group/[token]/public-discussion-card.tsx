"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { formatShortDateTime } from "@/lib/date";
import type { GroupComment } from "./public-group-types";

interface PublicDiscussionCardProps {
  nameSet: boolean;
  loading: string;
  comment: string;
  onCommentChange: (val: string) => void;
  onComment: () => void;
  comments: GroupComment[];
}

export default function PublicDiscussionCard({
  nameSet,
  loading,
  comment,
  onCommentChange,
  onComment,
  comments,
}: PublicDiscussionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Diskussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {nameSet && (
          <div className="flex gap-2">
            <Input
              placeholder="Schreibe einen Kommentar…"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onComment()}
            />
            <Button
              onClick={() => onComment()}
              disabled={loading === "comment" || !comment.trim()}
            >
              Senden
            </Button>
          </div>
        )}
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Kommentare.
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatShortDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
