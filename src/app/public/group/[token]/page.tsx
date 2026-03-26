"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Vote,
  Lock,
} from "lucide-react";
import type { GroupPoll, GroupComment } from "./public-group-types";
import PublicPollCard from "./public-poll-card";
import PublicDiscussionCard from "./public-discussion-card";

interface GroupMember {
  id: string;
  user: { name: string };
}

interface Group {
  name: string;
  description?: string;
  members?: GroupMember[];
  polls?: GroupPoll[];
  comments?: GroupComment[];
}

interface PublicGroupPageProps {
  params: Promise<{ token: string }>;
}

export default function PublicGroupPage({ params }: PublicGroupPageProps) {
  const [token, setToken] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [voterName, setVoterName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [loading, setLoading] = useState("init");
  const [comment, setComment] = useState("");
  const [pollComments, setPollComments] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetchGroup(t, "");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function fetchGroup(t: string, pw: string) {
    setLoading("fetch");
    try {
      const headers: HeadersInit = pw ? { "x-group-password": pw } : {};
      const res = await fetch(`/api/public/group/${t}`, { headers });
      const data = await res.json();

      if (res.status === 403 && data.requiresPassword) {
        setRequiresPassword(true);
        setGroup({ name: data.name });
        setLoading("");
        return;
      }

      if (res.status === 404) {
        setGroup(null);
        setLoading("notfound");
        return;
      }

      setGroup(data);
      setRequiresPassword(false);
    } catch {
      setGroup(null);
    } finally {
      if (loading !== "notfound") setLoading("");
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    fetchGroup(token, password);
  }

  async function handleVote(pollId: string, optionId: string) {
    if (!voterName.trim()) return;
    setLoading(`vote-${pollId}`);
    try {
      await fetch(`/api/public/group/${token}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId,
          optionIds: [optionId],
          voterName: voterName.trim(),
          password: password || undefined,
        }),
      });
      fetchGroup(token, password);
    } finally {
      setLoading("");
    }
  }

  async function handleComment(pollId?: string) {
    const text = pollId ? pollComments[pollId] : comment;
    if (!text?.trim() || !voterName.trim()) return;
    setLoading(pollId ? `comment-${pollId}` : "comment");
    try {
      await fetch(`/api/public/group/${token}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          pollId: pollId || null,
          authorName: voterName.trim(),
          password: password || undefined,
        }),
      });
      if (pollId) {
        setPollComments((prev) => ({ ...prev, [pollId]: "" }));
      } else {
        setComment("");
      }
      fetchGroup(token, password);
    } finally {
      setLoading("");
    }
  }

  if (loading === "init" || loading === "fetch") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (loading === "notfound" || (!group && !requiresPassword)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold mb-2">Gruppe nicht gefunden</h1>
          <p className="text-muted-foreground">Der Link ist ungültig oder die Gruppe ist nicht öffentlich.</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (requiresPassword && !group?.polls) {
    return (
      <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-12">
        <div className="mx-auto w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <CardTitle>{group?.name || "Geschützte Gruppe"}</CardTitle>
              <CardDescription>
                Diese Gruppe ist passwortgeschützt. Bitte gib das Passwort ein.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <Input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                <Button type="submit" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Zugang erhalten
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-8">
      <div className="mx-auto w-full max-w-4xl px-4 space-y-6">
        {/* Hero Card */}
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                👥
              </div>
              {group!.name}
            </CardTitle>
            {group!.description && (
              <p className="text-muted-foreground">{group!.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group!.members?.length || 0} Mitglieder
              </div>
              <div className="flex items-center gap-1">
                <Vote className="h-4 w-4" />
                {group!.polls?.length || 0} Abstimmungen
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Name Entry */}
        {!nameSet ? (
          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (voterName.trim()) setNameSet(true);
                }}
                className="space-y-3"
              >
                <Label>Dein Name</Label>
                <p className="text-sm text-muted-foreground">
                  Gib deinen Namen ein, um abstimmen und kommentieren zu können.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Dein Name"
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={!voterName.trim()}>
                    Weiter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Angemeldet als <strong>{voterName}</strong>{" "}
            <button
              className="underline"
              onClick={() => setNameSet(false)}
            >
              (ändern)
            </button>
          </p>
        )}

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Mitglieder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {group!.members?.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                >
                  {m.user.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Polls */}
        {group!.polls?.map((poll) => (
          <PublicPollCard
            key={poll.id}
            poll={poll}
            voterName={voterName}
            nameSet={nameSet}
            loading={loading}
            pollComment={pollComments[poll.id] || ""}
            onPollCommentChange={(val) => setPollComments((prev) => ({ ...prev, [poll.id]: val }))}
            onVote={handleVote}
            onComment={handleComment}
          />
        ))}

        {/* General Discussion */}
        <PublicDiscussionCard
          nameSet={nameSet}
          loading={loading}
          comment={comment}
          onCommentChange={setComment}
          onComment={() => handleComment()}
          comments={group!.comments || []}
        />
      </div>
    </div>
  );
}
