"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Vote,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Plus,
  Lock,
  X,
  UserPlus,
  Settings,
} from "lucide-react";
import { SerializedGroup, SerializedGroupComment, SerializedGroupMember } from "@/types/group";
import { getClientBaseUrl } from "@/lib/public-link";
import { CreatePollForm } from "./create-poll-form";
import { PollCard } from "./poll-card";

interface GroupDetailClientProps {
  group: SerializedGroup;
  userId: string;
  isOwner: boolean;
  initialPublicUrl: string | null;
}

export function GroupDetailClient({ group, userId, isOwner, initialPublicUrl }: GroupDetailClientProps) {
  const router = useRouter();
  const [publicUrl, setPublicUrl] = useState(initialPublicUrl);
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [comment, setComment] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [groupPassword, setGroupPassword] = useState(group.password || "");
  const [loading, setLoading] = useState("");

  const refresh = useCallback(() => router.refresh(), [router]);

  async function handlePublish() {
    setLoading("publish");
    try {
      const res = await fetch(`/api/groups/${group.id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPublicUrl(`${getClientBaseUrl()}/public/group/${data.shareToken}`);
      }
    } finally {
      setLoading("");
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError("");
    setLoading("member");
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMemberError(data.error);
        return;
      }
      setMemberEmail("");
      setShowAddMember(false);
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleRemoveMember(memberId: string) {
    setLoading(`remove-${memberId}`);
    try {
      await fetch(`/api/groups/${group.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setLoading("comment");
    try {
      await fetch(`/api/groups/${group.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim(), pollId: null }),
      });
      setComment("");
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleSavePassword() {
    setLoading("password");
    try {
      await fetch(`/api/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: groupPassword || null }),
      });
      refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <>
      {/* Group Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  👥
                </div>
                {group.name}
              </CardTitle>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Einstellungen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {showSettings && isOwner && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Seitenpasswort (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder="Passwort für öffentlichen Zugang"
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePassword}
                    disabled={loading === "password"}
                  >
                    {loading === "password" ? "..." : "Speichern"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Wenn gesetzt, müssen Besucher über den öffentlichen Link dieses Passwort eingeben.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Share + Members Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Share Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Öffentlicher Link
            </CardTitle>
            <CardDescription>
              Teile diesen Link, damit andere abstimmen und kommentieren können
            </CardDescription>
          </CardHeader>
          <CardContent>
            {publicUrl ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={publicUrl} readOnly className="text-sm" />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {group.password && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Passwortgeschützt
                  </p>
                )}
              </div>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={loading === "publish"}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {loading === "publish" ? "Wird veröffentlicht..." : "Öffentlichen Link erstellen"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Members Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mitglieder ({group.members.length})
              </CardTitle>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMember(!showAddMember)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {showAddMember && (
              <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
                <Input
                  placeholder="E-Mail-Adresse"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" type="submit" disabled={loading === "member"}>
                  {loading === "member" ? "..." : "Einladen"}
                </Button>
              </form>
            )}
            {memberError && <p className="text-sm text-destructive">{memberError}</p>}
            {group.members.map((member: SerializedGroupMember) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">
                    {member.user.name?.[0] ?? "?"}
                  </div>
                  <span className="text-sm">{member.user.name}</span>
                  {member.role === "owner" && (
                    <Badge variant="secondary" className="text-xs">Owner</Badge>
                  )}
                </div>
                {isOwner && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user.id)}
                    disabled={loading === `remove-${member.user.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Polls Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Abstimmungen ({group.polls.length})
              </CardTitle>
              <CardDescription>Erstelle Umfragen und stimme ab</CardDescription>
            </div>
            <Button onClick={() => setShowCreatePoll(!showCreatePoll)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Abstimmung
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Poll Form */}
          {showCreatePoll && <CreatePollForm groupId={group.id} loading={loading} setLoading={setLoading} onCreated={() => { setShowCreatePoll(false); refresh(); }} onCancel={() => setShowCreatePoll(false)} />}

          {/* Poll List */}
          {group.polls.length === 0 && !showCreatePoll ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="font-semibold mb-2">Noch keine Abstimmungen</h3>
              <p className="text-muted-foreground mb-4">
                Erstelle eine Abstimmung, um die Meinung der Gruppe einzuholen.
              </p>
            </div>
          ) : (
            group.polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} groupId={group.id} userId={userId} isOwner={isOwner} onRefresh={refresh} />
            ))
          )}
        </CardContent>
      </Card>

      {/* General Comments */}
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
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <Button
              onClick={() => handleComment()}
              disabled={loading === "comment" || !comment.trim()}
            >
              Senden
            </Button>
          </div>
          {group.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Kommentare. Starte die Diskussion!
            </p>
          ) : (
            <div className="space-y-2">
              {group.comments.map((c: SerializedGroupComment) => (
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
    </>
  );
}
