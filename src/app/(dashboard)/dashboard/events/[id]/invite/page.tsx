"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Plus, Trash2, Users, Check, X } from "lucide-react";

interface Invite {
  id?: string;
  email?: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  status: "pending" | "accepted" | "declined";
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function EventInvitePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<any>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInviteSaving, setUserInviteSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Event und bestehende Einladungen laden
        const [eventRes, usersRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch('/api/users'),
        ]);
        
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
          setInvites(eventData.invites || []);
        }

        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData);
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

  const addInvite = async () => {
    if (!newEmail.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Fehler beim Hinzufügen der Einladung');
      }

      const newInvite = await response.json();
      setInvites(prev => [...prev, newInvite]);
      setNewEmail("");
      
    } catch (error) {
      console.error('Add invite error:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Einladung');
    } finally {
      setSaving(false);
    }
  };

  const addUserInvite = async () => {
    if (!selectedUserId) return;

    setUserInviteSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Fehler beim Hinzufügen der Einladung');
      }

      const newInvite = await response.json();
      setInvites(prev => [...prev, newInvite]);
      setSelectedUserId("");
    } catch (error) {
      console.error('Add user invite error:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Einladung');
    } finally {
      setUserInviteSaving(false);
    }
  };

  const removeInvite = async (inviteId: string) => {
    if (!confirm('Möchtest du diese Einladung wirklich entfernen?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen der Einladung');
      }

      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
    } catch (error) {
      console.error('Remove invite error:', error);
      alert('Fehler beim Entfernen der Einladung');
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/invites/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Erinnerung');
      }

      alert('Erinnerung wurde gesendet!');
      
    } catch (error) {
      console.error('Resend error:', error);
      alert('Fehler beim Senden der Erinnerung');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/dashboard/events/${eventId}`)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Event
        </button>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Einladungen verwalten
          </CardTitle>
          <CardDescription>
            {event.title} • {new Date(event.eventDate).toLocaleDateString('de-DE')}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Neue Einladung */}
        <Card>
          <CardHeader>
            <CardTitle>Neue Einladung</CardTitle>
            <CardDescription>
              Lade weitere Personen per E-Mail ein oder wähle vorhandene Nutzer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail Adresse</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="max@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && addInvite()}
                />
                <Button onClick={addInvite} disabled={saving || !newEmail.trim()} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <Label htmlFor="user-select">Bestehenden Nutzer auswählen</Label>
              <div className="flex gap-2 mt-1">
                <select
                  id="user-select"
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Nutzer auswählen...</option>
                  {users
                    .filter(user => !invites.some(inv => inv.userId === user.id))
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
                <Button
                  onClick={addUserInvite}
                  disabled={userInviteSaving || !selectedUserId}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {userInviteSaving ? 'Wird hinzugefügt...' : 'Einladen'}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Die Person erhält eine E-Mail mit Einladung zum Event</p>
              <p>• Sie kann zusagen oder ablehnen</p>
              <p>• Bestehende User werden direkt verknüpft</p>
            </div>
          </CardContent>
        </Card>

        {/* Bestehende Einladungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bestehende Einladungen ({invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Noch keine Einladungen vorhanden
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm">
                        {invite.user ? invite.user.name[0].toUpperCase() : "?"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {invite.user?.name || invite.email}
                        </div>
                        {invite.user && (
                          <div className="text-sm text-muted-foreground">
                            {invite.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        invite.status === "accepted" ? "default" :
                        invite.status === "declined" ? "destructive" : "secondary"
                      }>
                        {invite.status === "accepted" ? (
                          <><Check className="h-3 w-3 mr-1" />Zugesagt</>
                        ) : invite.status === "declined" ? (
                          <><X className="h-3 w-3 mr-1" />Abgelehnt</>
                        ) : (
                          "Ausstehend"
                        )}
                      </Badge>
                      
                      {invite.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInvite(invite.id!)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeInvite(invite.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zusammenfassung */}
      <Card>
        <CardHeader>
          <CardTitle>Einladungs-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-success">
                {invites.filter(i => i.status === "accepted").length}
              </div>
              <div className="text-sm text-muted-foreground">Zugesagt</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {invites.filter(i => i.status === "pending").length}
              </div>
              <div className="text-sm text-muted-foreground">Ausstehend</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {invites.filter(i => i.status === "declined").length}
              </div>
              <div className="text-sm text-muted-foreground">Abgelehnt</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
