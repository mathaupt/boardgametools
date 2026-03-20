"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  CheckCircle,
  BarChart3,
  UserPlus,
  Settings,
  Gamepad2,
  Search,
  ExternalLink,
  Loader2,
  ImageIcon,
  Clock,
} from "lucide-react";
import { getClientBaseUrl } from "@/lib/public-link";

interface GameItem {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  bggId: string | null;
}

interface BGGResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface GroupDetailClientProps {
  group: any;
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
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollType, setPollType] = useState("single");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollError, setPollError] = useState("");
  const [comment, setComment] = useState("");
  const [pollComments, setPollComments] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [groupPassword, setGroupPassword] = useState(group.password || "");
  const [loading, setLoading] = useState("");
  // Game-based poll options
  const [optionsAreGames, setOptionsAreGames] = useState(false);
  const [gameTab, setGameTab] = useState<"collection" | "bgg">("collection");
  const [collectionGames, setCollectionGames] = useState<GameItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [bggSearch, setBggSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGResult[]>([]);
  const [bggSearching, setBggSearching] = useState(false);

  const refresh = useCallback(() => router.refresh(), [router]);

  // Load collection games when game mode is activated
  useEffect(() => {
    if (optionsAreGames && collectionGames.length === 0) {
      setLoadingGames(true);
      fetch("/api/games")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCollectionGames(data))
        .finally(() => setLoadingGames(false));
    }
  }, [optionsAreGames, collectionGames.length]);

  async function handleSearchBGG() {
    if (bggSearch.length < 2) return;
    setBggSearching(true);
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(bggSearch)}`);
      if (res.ok) setBggResults(await res.json());
    } catch { /* ignore */ }
    setBggSearching(false);
  }

  function addGameAsOption(name: string) {
    if (pollOptions.includes(name)) return;
    // Replace first empty slot, or append
    const emptyIdx = pollOptions.findIndex((o) => !o.trim());
    if (emptyIdx >= 0) {
      const newOpts = [...pollOptions];
      newOpts[emptyIdx] = name;
      setPollOptions(newOpts);
    } else {
      setPollOptions([...pollOptions, name]);
    }
  }

  async function addBGGGameAsOption(bggId: string) {
    // Fetch game details from BGG and add the name
    try {
      const res = await fetch(`/api/bgg?bggId=${bggId}`);
      if (res.ok) {
        const game = await res.json();
        addGameAsOption(game.name || bggId);
      }
    } catch {
      // Fallback: find name from search results
      const result = bggResults.find((r) => r.bggId === bggId);
      if (result) addGameAsOption(result.name);
    }
  }

  const filteredCollectionGames = collectionGames.filter(
    (g) =>
      g.name.toLowerCase().includes(gameSearch.toLowerCase()) &&
      !pollOptions.includes(g.name)
  );

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

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    setPollError("");
    const validOptions = pollOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setPollError("Mindestens 2 Optionen erforderlich");
      return;
    }
    setLoading("poll");
    try {
      const res = await fetch(`/api/groups/${group.id}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle,
          description: pollDescription || null,
          type: pollType,
          options: validOptions,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPollError(data.error);
        return;
      }
      setPollTitle("");
      setPollDescription("");
      setPollOptions(["", ""]);
      setOptionsAreGames(false);
      setShowCreatePoll(false);
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleVote(pollId: string, optionId: string, pollType: string) {
    setLoading(`vote-${pollId}`);
    try {
      await fetch(`/api/groups/${group.id}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: [optionId] }),
      });
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleClosePoll(pollId: string) {
    setLoading(`close-${pollId}`);
    try {
      await fetch(`/api/groups/${group.id}/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleDeletePoll(pollId: string) {
    setLoading(`delete-${pollId}`);
    try {
      await fetch(`/api/groups/${group.id}/polls/${pollId}`, { method: "DELETE" });
      refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleComment(pollId?: string) {
    const text = pollId ? pollComments[pollId] : comment;
    if (!text?.trim()) return;
    setLoading(pollId ? `comment-${pollId}` : "comment");
    try {
      await fetch(`/api/groups/${group.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), pollId: pollId || null }),
      });
      if (pollId) {
        setPollComments((prev) => ({ ...prev, [pollId]: "" }));
      } else {
        setComment("");
      }
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

  const userVotedOption = (poll: any) => {
    for (const option of poll.options) {
      const vote = option.votes.find((v: any) => v.userId === userId);
      if (vote) return option.id;
    }
    return null;
  };

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
            {group.members.map((member: any) => (
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
          {showCreatePoll && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <form onSubmit={handleCreatePoll} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Frage / Titel *</Label>
                    <Input
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="z.B. Welches Legacy-Spiel als nächstes?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={pollDescription}
                      onChange={(e) => setPollDescription(e.target.value)}
                      placeholder="Optionale Details zur Abstimmung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Typ</Label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="single"
                          checked={pollType === "single"}
                          onChange={() => setPollType("single")}
                        />
                        Einzelwahl
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="multiple"
                          checked={pollType === "multiple"}
                          onChange={() => setPollType("multiple")}
                        />
                        Mehrfachwahl
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Optionen *</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="game-switch" className="text-xs text-muted-foreground flex items-center gap-1">
                          <Gamepad2 className="h-3 w-3" />
                          Optionen sind Spiele
                        </Label>
                        <Switch
                          id="game-switch"
                          checked={optionsAreGames}
                          onCheckedChange={(checked) => {
                            setOptionsAreGames(checked);
                            if (checked) {
                              setPollOptions(["", ""]);
                              setGameSearch("");
                              setBggSearch("");
                              setBggResults([]);
                              setGameTab("collection");
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Selected options (both modes) */}
                    {pollOptions.filter((o) => o.trim()).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {pollOptions.filter((o) => o.trim()).map((opt, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                          >
                            {optionsAreGames && <Gamepad2 className="h-3 w-3" />}
                            {opt}
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {optionsAreGames ? (
                      <div className="border rounded-lg overflow-hidden">
                        {/* Sammlung / BGG Import Tabs */}
                        <div className="flex border-b">
                          <button
                            type="button"
                            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              gameTab === "collection"
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setGameTab("collection")}
                          >
                            Aus Sammlung
                          </button>
                          <button
                            type="button"
                            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              gameTab === "bgg"
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setGameTab("bgg")}
                          >
                            <span className="flex items-center justify-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              BGG Import
                            </span>
                          </button>
                        </div>

                        <div className="p-3 max-h-56 overflow-y-auto">
                          {gameTab === "collection" ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Spiel suchen..."
                                  value={gameSearch}
                                  onChange={(e) => setGameSearch(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                              {loadingGames ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : filteredCollectionGames.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {gameSearch ? "Keine Spiele gefunden." : "Keine weiteren Spiele verfügbar."}
                                </p>
                              ) : (
                                filteredCollectionGames.map((game) => (
                                  <button
                                    key={game.id}
                                    type="button"
                                    onClick={() => addGameAsOption(game.name)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden">
                                      {game.imageUrl ? (
                                        <img src={game.imageUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-3 w-3" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{game.name}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-0.5">
                                          <Users className="h-3 w-3" />
                                          {game.minPlayers}-{game.maxPlayers}
                                        </span>
                                        {game.playTimeMinutes && (
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="h-3 w-3" />
                                            {game.playTimeMinutes} Min.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  </button>
                                ))
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Spiel auf BGG suchen..."
                                    value={bggSearch}
                                    onChange={(e) => setBggSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchBGG())}
                                    className="pl-9"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleSearchBGG}
                                  disabled={bggSearching || bggSearch.length < 2}
                                >
                                  {bggSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                                </Button>
                              </div>
                              {bggSearching ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : bggResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {bggSearch.length >= 2
                                    ? "Keine Ergebnisse gefunden."
                                    : "Suchbegriff eingeben und auf BGG suchen."}
                                </p>
                              ) : (
                                bggResults.map((result) => (
                                  <button
                                    key={result.bggId}
                                    type="button"
                                    onClick={() => addBGGGameAsOption(result.bggId)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{result.name}</p>
                                      {result.yearPublished && (
                                        <p className="text-xs text-muted-foreground">{result.yearPublished}</p>
                                      )}
                                    </div>
                                    <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[i] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={`Option ${i + 1}`}
                            />
                            {pollOptions.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPollOptions([...pollOptions, ""])}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Option hinzufügen
                        </Button>
                      </>
                    )}
                  </div>
                  {pollError && <p className="text-sm text-destructive">{pollError}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading === "poll"}>
                      {loading === "poll" ? "Erstelle..." : "Abstimmung erstellen"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreatePoll(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

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
            group.polls.map((poll: any) => {
              const totalVotes = poll.options.reduce(
                (sum: number, opt: any) => sum + opt._count.votes,
                0
              );
              const myVote = userVotedOption(poll);
              const isOpen = poll.status === "open";
              const canManage =
                poll.createdBy?.id === userId || isOwner;

              return (
                <Card key={poll.id} className={!isOpen ? "opacity-75" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center flex-wrap gap-2">
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
                          von {poll.createdBy?.name} · {new Date(poll.createdAt).toLocaleDateString("de-DE")}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePoll(poll.id)}
                            disabled={loading === `delete-${poll.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Options with vote bars */}
                    {poll.options.map((option: any) => {
                      const voteCount = option._count.votes;
                      const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                      const isMyVote = myVote === option.id;
                      const voterNames = option.votes.map((v: any) => v.voterName).join(", ");

                      return (
                        <button
                          key={option.id}
                          onClick={() => isOpen && handleVote(poll.id, option.id, poll.type)}
                          disabled={!isOpen || loading === `vote-${poll.id}`}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isMyVote
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          } ${!isOpen ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
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
                        placeholder="Kommentar zur Abstimmung..."
                        value={pollComments[poll.id] || ""}
                        onChange={(e) =>
                          setPollComments((prev) => ({ ...prev, [poll.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleComment(poll.id)}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComment(poll.id)}
                        disabled={loading === `comment-${poll.id}`}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
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
              {group.comments.map((c: any) => (
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
