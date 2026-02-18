"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Game, Event, GameProposal, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Users, Star, Trophy, Vote, X, Search, ExternalLink, Gamepad2 } from "lucide-react";

interface ProposalWithDetails extends GameProposal {
  game: Game;
  proposedBy: User;
  _count: { votes: number };
  userVoted?: boolean;
}

export default function EventVotingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bggResults, setBggResults] = useState<any[]>([]);
  const [bggLoading, setBggLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"collection" | "bgg">("collection");

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
          const eventData = await eventRes.json();
          setEvent(eventData);
          
          // User Votes prüfen für jedes Proposal
          const proposalsWithVotes = await Promise.all(
            eventData.proposals.map(async (proposal: any) => {
              const voteRes = await fetch(`/api/events/${eventId}/votes?proposalId=${proposal.id}`, {
            headers: {
              'Content-Type': 'application/json',
            }
          });
              const hasVoted = voteRes.ok;
              
              return {
                ...proposal,
                userVoted: hasVoted
              };
            })
          );
          
          // Sortieren nach Vote Count
          setProposals(proposalsWithVotes.sort((a, b) => b._count.votes - a._count.votes));
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
      alert('Fehler beim Abstimmen');
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
      alert('Fehler beim Entfernen des Votes');
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
        throw new Error('Fehler beim Hinzufügen des Vorschlags');
      }

      const newProposal = await response.json();
      setProposals(prev => [...prev, { ...newProposal, userVoted: false }]);
      
    } catch (error) {
      console.error('Add proposal error:', error);
      alert('Fehler beim Hinzufügen des Vorschlags');
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
      
      alert(`Spiel "${bggGame.name}" wurde importiert und vorgeschlagen!`);
      
    } catch (error) {
      console.error('BGG import error:', error);
      alert('Fehler beim Importieren des Spiels');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event nicht gefunden</h1>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Event
        </button>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
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
        {/* Rangliste */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Voting-Rangliste
          </h2>
          
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-4">🗳️</div>
                <h3 className="font-semibold mb-2">Noch keine Vorschläge</h3>
                <p className="text-gray-600 mb-4">
                  Füge Spiele hinzu, damit abgestimmt werden kann.
                </p>
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal, index) => (
              <Card key={proposal.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Game Image */}
                        <div className="flex-shrink-0">
                          {proposal.game.imageUrl ? (
                            <img 
                              src={proposal.game.imageUrl} 
                              alt={proposal.game.name}
                              className="w-12 h-12 rounded-lg object-cover border border-border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-game.png';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <CardTitle className="text-lg">{proposal.game.name}</CardTitle>
                      </div>
                      
                      {/* Spiel-Details */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {proposal.game.minPlayers}-{proposal.game.maxPlayers} Spieler
                        </Badge>
                        
                        {proposal.game.playTimeMinutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            ⏱️ {proposal.game.playTimeMinutes} Min.
                          </Badge>
                        )}
                        
                        {proposal.game.complexity && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {"★".repeat(proposal.game.complexity)}{"☆".repeat(5 - proposal.game.complexity)}
                          </Badge>
                        )}
                      </div>
                      
                      <CardDescription>
                        Vorgeschlagen von {proposal.proposedBy.name}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{proposal._count.votes}</div>
                        <div className="text-sm text-gray-500">Votes</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    {proposal.game.description && (
                      <p className="text-sm text-gray-600 flex-1 mr-4">
                        {proposal.game.description}
                      </p>
                    )}
                    
                    <Button
                      onClick={() => proposal.userVoted ? handleRemoveVote(proposal.id) : handleVote(proposal.id)}
                      disabled={voting === proposal.id}
                      variant={proposal.userVoted ? "outline" : "default"}
                      className="flex items-center gap-2"
                    >
                      {proposal.userVoted ? (
                        <>
                          <X className="h-4 w-4" />
                          Vote entfernen
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4" />
                          {voting === proposal.id ? 'Wird abgestimmt...' : 'Vote'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Spiele hinzufügen */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Spiel vorschlagen
          </h2>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Spiel auswählen</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === "collection" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("collection")}
                  >
                    Meine Sammlung
                  </Button>
                  <Button
                    variant={activeTab === "bgg" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("bgg")}
                  >
                    BGG Suche
                  </Button>
                </div>
              </div>
              <CardDescription>
                {activeTab === "collection" 
                  ? "Wähle ein Spiel aus deiner Sammlung" 
                  : "Suche und importiere Spiele von BoardGameGeek"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === "collection" ? (
                // Eigene Sammlung
                <>
                  {availableGames.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Alle Spiele wurden bereits vorgeschlagen
                    </p>
                  ) : (
                    availableGames.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {/* Game Image */}
                          <div className="flex-shrink-0">
                            {game.imageUrl ? (
                              <img 
                                src={game.imageUrl} 
                                alt={game.name}
                                className="w-10 h-10 rounded-lg object-cover border border-border"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-game.png';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{game.name}</div>
                            <div className="text-sm text-gray-500">
                              {game.minPlayers}-{game.maxPlayers} Spieler
                              {game.complexity && ` • ${game.complexity}/5 Komplexität`}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddProposal(game.id)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Vorschlagen
                        </Button>
                      </div>
                    ))
                  )}
                </>
              ) : (
                // BGG Suche
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="z.B. Catan, Monopoly, Carcassonne..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBggSearch()}
                    />
                    <Button onClick={handleBggSearch} disabled={bggLoading}>
                      <Search className="h-4 w-4 mr-2" />
                      {bggLoading ? 'Suche...' : 'Suchen'}
                    </Button>
                  </div>

                  {bggResults.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-2">
                        {bggResults.length} Spiele gefunden
                      </p>
                      {bggResults.map((game) => (
                        <div key={game.bggId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Game Image */}
                            <div className="flex-shrink-0">
                              {game.imageUrl ? (
                                <img 
                                  src={game.imageUrl} 
                                  alt={game.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-border"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-game.png';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{game.name}</div>
                              {game.yearPublished && (
                                <div className="text-sm text-gray-500">{game.yearPublished}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBggImport(game.bggId)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Importieren
                            </Button>
                            <a
                              href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && bggResults.length === 0 && !bggLoading && (
                    <p className="text-gray-500 text-center py-4">
                      Keine Spiele gefunden für "{searchQuery}"
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
