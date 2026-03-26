"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProposalWithDetails, EventResponse } from "./voting-types";
import ProposalRankingList from "./proposal-ranking-list";
import GameProposalPanel from "./game-proposal-panel";

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: string;
  type: string;
  imageUrl?: string;
}

interface VotingClientProps {
  initialEvent: EventResponse;
  initialGames: Game[];
  eventId: string;
}

export default function VotingClient({ initialEvent, initialGames, eventId }: VotingClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [event] = useState<EventResponse>(initialEvent);
  const [proposals, setProposals] = useState<ProposalWithDetails[]>(() => {
    return initialEvent.proposals
      .map((p) => ({ ...p, userVoted: p.userHasVoted ?? p.userVoted ?? false }))
      .sort((a, b) => b._count.votes - a._count.votes);
  });
  const [games, setGames] = useState<Game[]>(initialGames);
  const [voting, setVoting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGSearchResult[]>([]);
  const [bggLoading, setBggLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"collection" | "bgg">("collection");
  const [deletingProposal, setDeletingProposal] = useState<string | null>(null);

  const handleVote = async (proposalId: string) => {
    setVoting(proposalId);
    try {
      const res = await fetch(`/api/events/${eventId}/votes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      if (!res.ok) throw new Error("Fehler beim Abstimmen");
      setProposals((prev) => prev.map((p) =>
        p.id === proposalId ? { ...p, userVoted: true, _count: { ...p._count, votes: p._count.votes + 1 } } : p
      ).sort((a, b) => b._count.votes - a._count.votes));
    } catch (error) {
      console.error("Vote error:", error);
      toast({ title: "Fehler beim Abstimmen", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally { setVoting(null); }
  };

  const handleRemoveVote = async (proposalId: string) => {
    setVoting(proposalId);
    try {
      const res = await fetch(`/api/events/${eventId}/votes?proposalId=${proposalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Entfernen");
      setProposals((prev) => prev.map((p) =>
        p.id === proposalId ? { ...p, userVoted: false, _count: { ...p._count, votes: p._count.votes - 1 } } : p
      ).sort((a, b) => b._count.votes - a._count.votes));
    } catch (error) {
      console.error("Remove vote error:", error);
      toast({ title: "Fehler", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally { setVoting(null); }
  };

  const handleAddProposal = async (gameId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/proposals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Fehler"); }
      const newProposal = await res.json();
      setProposals((prev) => [...prev, { ...newProposal, userVoted: false }]);
    } catch (error) {
      console.error("Add proposal error:", error);
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Bitte versuche es erneut.", variant: "destructive" });
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    setDeletingProposal(proposalId);
    try {
      const res = await fetch(`/api/events/${eventId}/proposals?proposalId=${proposalId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Fehler"); }
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      toast({ title: "Vorschlag geloescht" });
    } catch (error) {
      console.error("Delete proposal error:", error);
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Bitte versuche es erneut.", variant: "destructive" });
    } finally { setDeletingProposal(null); }
  };

  const handleBggSearch = async () => {
    if (!searchQuery.trim()) return;
    setBggLoading(true);
    try {
      const res = await fetch(`/api/bgg?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("BGG Search failed");
      setBggResults(await res.json());
    } catch (error) {
      console.error("BGG search error:", error);
      toast({ title: "Fehler", description: "Fehler bei der BGG Suche", variant: "destructive" });
    } finally { setBggLoading(false); }
  };

  const handleBggImport = async (bggId: string) => {
    try {
      const detailRes = await fetch(`/api/bgg?bggId=${bggId}`);
      if (!detailRes.ok) throw new Error("Failed to fetch BGG details");
      const bggGame = await detailRes.json();

      const createRes = await fetch("/api/games", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bggGame.name, description: bggGame.description,
          minPlayers: parseInt(bggGame.minPlayers || "2"), maxPlayers: parseInt(bggGame.maxPlayers || "4"),
          playTimeMinutes: bggGame.playTimeMinutes ? parseInt(bggGame.playTimeMinutes) : null,
          complexity: bggGame.complexity ? Math.round(parseFloat(bggGame.complexity)) : null,
          bggId: bggGame.bggId, imageUrl: bggGame.imageUrl,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create game");
      const newGame = await createRes.json();

      setGames((prev) => [...prev, newGame]);
      await handleAddProposal(newGame.id);
      setActiveTab("collection"); setSearchQuery(""); setBggResults([]);
      toast({ title: "Spiel importiert", description: `"${bggGame.name}" wurde importiert und vorgeschlagen!` });
    } catch (error) {
      console.error("BGG import error:", error);
      toast({ title: "Fehler beim Importieren", description: "Bitte versuche es erneut.", variant: "destructive" });
    }
  };

  const availableGames = games.filter((g) => !proposals.some((p) => p.gameId === g.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/dashboard/events/${eventId}`)} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />Zurueck zum Event
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>{new Date(event.eventDate).toLocaleDateString("de-DE")} - {event.location || "Kein Ort"}</CardDescription>
        </CardHeader>
        {event.description && <CardContent><p>{event.description}</p></CardContent>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ProposalRankingList proposals={proposals} voting={voting} deletingProposal={deletingProposal} eventIsCreator={event?.isCreator ?? false} currentUserId={event?.currentUserId ?? ""} onVote={handleVote} onRemoveVote={handleRemoveVote} onDeleteProposal={handleDeleteProposal} />
        </div>
        <div className="space-y-4">
          <GameProposalPanel availableGames={availableGames} collectionSearch={collectionSearch} onCollectionSearchChange={setCollectionSearch} activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} bggResults={bggResults} bggLoading={bggLoading} onAddProposal={handleAddProposal} onBggSearch={handleBggSearch} onBggImport={handleBggImport} />
        </div>
      </div>
    </div>
  );
}
