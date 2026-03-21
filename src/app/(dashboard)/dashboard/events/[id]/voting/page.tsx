"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EventVotingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGSearchResult[]>([]);
  const [bggLoading, setBggLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"collection" | "bgg">("collection");
  const [deletingProposal, setDeletingProposal] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Event und Proposals laden
        const [eventRes, gamesRes] = await Promise.all([
          fetch(`/api/events/${eventId}`, {
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch('/api/games', {
            headers: {
              'Content-Type': 'application/json',
            }
          })
        ]);
        
        if (eventRes.ok) {
          const eventData: EventResponse = await eventRes.json();
          setEvent(eventData);

          const normalizedProposals = eventData.proposals.map((proposal) => ({
            ...proposal,
            userVoted: proposal.userHasVoted ?? proposal.userVoted ?? false,
          }));

          setProposals(normalizedProposals.sort((a, b) => b._count.votes - a._count.votes));
        }
        
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleVote = async (proposalId: string) => {
    setVoting(proposalId);
    
    try {
      const response = await fetch(`/api/events/${eventId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abstimmen');
      }

      // Proposal-Liste aktualisieren
      setProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, userVoted: true, _count: { ...p._count, votes: p._count.votes + 1 } }
          : p
      ).sort((a, b) => b._count.votes - a._count.votes));
      
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Fehler beim Abstimmen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  const handleRemoveVote = async (proposalId: string) => {
    setVoting(proposalId);
    
    try {
      const response = await fetch(`/api/events/${eventId}/votes?proposalId=${proposalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen des Votes');
      }

      // Proposal-Liste aktualisieren
      setProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, userVoted: false, _count: { ...p._count, votes: p._count.votes - 1 } }
          : p
      ).sort((a, b) => b._count.votes - a._count.votes));
      
    } catch (error) {
      console.error('Remove vote error:', error);
      toast({
        title: "Fehler beim Entfernen des Votes",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  const handleAddProposal = async (gameId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Fehler beim Hinzufügen des Vorschlags');
      }

      const newProposal = await response.json();
      setProposals(prev => [...prev, { ...newProposal, userVoted: false }]);
      
    } catch (error) {
      console.error('Add proposal error:', error);
      toast({
        title: "Fehler beim Hinzufügen des Vorschlags",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    setDeletingProposal(proposalId);
    try {
      const response = await fetch(`/api/events/${eventId}/proposals?proposalId=${proposalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Fehler beim Löschen des Vorschlags');
      }

      setProposals(prev => prev.filter(p => p.id !== proposalId));
      toast({
        title: 'Vorschlag gelöscht',
        description: 'Das Spiel wurde aus der Vorschlagsliste entfernt.',
      });
    } catch (error) {
      console.error('Delete proposal error:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: error instanceof Error ? error.message : 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setDeletingProposal(null);
    }
  };

  const handleBggSearch = async () => {
    if (!searchQuery.trim()) return;

    setBggLoading(true);
    try {
      const response = await fetch(`/api/bgg?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('BGG Search failed');
      }

      const results = await response.json();
      setBggResults(results);
    } catch (error) {
      console.error('BGG search error:', error);
      alert('Fehler bei der BGG Suche');
    } finally {
      setBggLoading(false);
    }
  };

  const handleBggImport = async (bggId: string) => {
    try {
      // Zuerst Spiel-Details von BGG holen
      const detailsResponse = await fetch(`/api/bgg?bggId=${bggId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch BGG details');
      }

      const bggGame = await detailsResponse.json();

      // Spiel zur eigenen Sammlung hinzufügen
      const createResponse = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bggGame.name,
          description: bggGame.description,
          minPlayers: parseInt(bggGame.minPlayers || "2"),
          maxPlayers: parseInt(bggGame.maxPlayers || "4"),
          playTimeMinutes: bggGame.playTimeMinutes ? parseInt(bggGame.playTimeMinutes) : null,
          complexity: bggGame.complexity ? Math.round(parseFloat(bggGame.complexity)) : null,
          bggId: bggGame.bggId,
          imageUrl: bggGame.imageUrl
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create game');
      }

      const newGame = await createResponse.json();
      
      // Games Liste aktualisieren
      setGames(prev => [...prev, newGame]);
      
      // Als Vorschlag hinzufügen
      await handleAddProposal(newGame.id);
      
      // Zurück zur Collection Tab
      setActiveTab("collection");
      setSearchQuery("");
      setBggResults([]);
      
      toast({
        title: "Spiel importiert",
        description: `"${bggGame.name}" wurde erfolgreich importiert und vorgeschlagen!`,
        variant: "success",
      });
      
    } catch (error) {
      console.error('BGG import error:', error);
      toast({
        title: "Fehler beim Importieren des Spiels",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Event nicht gefunden</h1>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Zurück zu Events
          </button>
        </div>
      </div>
    );
  }

  // Spiele filtern (nicht bereits vorgeschlagen)
  const availableGames = games.filter(game => 
    !proposals.some(p => p.gameId === game.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/dashboard/events/${eventId}`)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Event
        </button>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
              📅
            </div>
            {event.title}
          </CardTitle>
          <CardDescription>
            {new Date(event.eventDate).toLocaleDateString('de-DE')} • {event.location || 'Kein Ort'}
          </CardDescription>
        </CardHeader>
        {event.description && (
          <CardContent>
            <p>{event.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Voting Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ProposalRankingList
            proposals={proposals}
            voting={voting}
            deletingProposal={deletingProposal}
            eventIsCreator={event?.isCreator ?? false}
            currentUserId={event?.currentUserId ?? ""}
            onVote={handleVote}
            onRemoveVote={handleRemoveVote}
            onDeleteProposal={handleDeleteProposal}
          />
        </div>
        <div className="space-y-4">
          <GameProposalPanel
            availableGames={availableGames}
            collectionSearch={collectionSearch}
            onCollectionSearchChange={setCollectionSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            bggResults={bggResults}
            bggLoading={bggLoading}
            onAddProposal={handleAddProposal}
            onBggSearch={handleBggSearch}
            onBggImport={handleBggImport}
          />
        </div>
      </div>
    </div>
  );
}
