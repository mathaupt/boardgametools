"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { SerializedGroupComment } from "@/types/group";

interface GroupCommentsSectionProps {
  comments: SerializedGroupComment[];
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
  loading: string;
}

export function GroupCommentsSection({
  comments,
  comment,
  onCommentChange,
  onSubmitComment,
  loading,
}: GroupCommentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Diskussion
        </CardTitle>
        <CardDescription>Allgemeine Kommentare zur Gruppe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Schreibe einen Kommentar..."
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmitComment()}
          />
          <Button
            onClick={onSubmitComment}
            disabled={loading === "comment" || !comment.trim()}
          >
            Senden
          </Button>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Kommentare. Starte die Diskussion!
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((c: SerializedGroupComment) => (
              <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
