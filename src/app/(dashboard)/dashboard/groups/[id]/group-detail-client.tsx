"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Lock, Settings } from "lucide-react";
import { SerializedGroup } from "@/types/group";
import { getClientBaseUrl } from "@/lib/public-link";
import { GroupMembersSection } from "./group-members-section";
import { GroupPollsSection } from "./group-polls-section";
import { GroupCommentsSection } from "./group-comments-section";

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

        <GroupMembersSection
          members={group.members}
          isOwner={isOwner}
          showAddMember={showAddMember}
          onToggleAddMember={() => setShowAddMember(!showAddMember)}
          memberEmail={memberEmail}
          onMemberEmailChange={setMemberEmail}
          memberError={memberError}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          loading={loading}
        />
      </div>

      <GroupPollsSection
        group={group}
        userId={userId}
        isOwner={isOwner}
        showCreatePoll={showCreatePoll}
        onToggleCreatePoll={() => setShowCreatePoll(!showCreatePoll)}
        loading={loading}
        setLoading={setLoading}
        onPollCreated={() => { setShowCreatePoll(false); refresh(); }}
        onRefresh={refresh}
      />

      <GroupCommentsSection
        comments={group.comments}
        comment={comment}
        onCommentChange={setComment}
        onSubmitComment={handleComment}
        loading={loading}
      />
    </>
  );
}
