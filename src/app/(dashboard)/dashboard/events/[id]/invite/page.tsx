"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddInviteForm } from "./add-invite-form";
import { InviteList, InviteStatusSummary } from "./invite-list";

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

interface EventData {
  title: string;
  eventDate: string;
  invites: Invite[];
}

export default function EventInvitePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInviteSaving, setUserInviteSaving] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

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
        headers: { 'Content-Type': 'application/json' },
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
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Fehler beim Hinzufügen der Einladung", variant: "destructive" });
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
        headers: { 'Content-Type': 'application/json' },
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
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Fehler beim Hinzufügen der Einladung", variant: "destructive" });
    } finally {
      setUserInviteSaving(false);
    }
  };

  const removeInvite = (inviteId: string) => {
    setPendingRemoveId(inviteId);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveInvite = async () => {
    if (!pendingRemoveId) return;
    setRemoveDialogOpen(false);

    try {
      const response = await fetch(`/api/events/${eventId}/invites?inviteId=${pendingRemoveId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen der Einladung');
      }

      setInvites(prev => prev.filter(invite => invite.id !== pendingRemoveId));
    } catch (error) {
      console.error('Remove invite error:', error);
      toast({ title: "Fehler", description: "Fehler beim Entfernen der Einladung", variant: "destructive" });
    } finally {
      setPendingRemoveId(null);
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/invites/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Erinnerung');
      }

      toast({ title: "Erinnerung gesendet", description: "Die Erinnerung wurde erfolgreich versendet." });
    } catch (error) {
      console.error('Resend error:', error);
      toast({ title: "Fehler", description: "Fehler beim Senden der Erinnerung", variant: "destructive" });
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
        <AddInviteForm
          newEmail={newEmail}
          onNewEmailChange={setNewEmail}
          onAddInvite={addInvite}
          saving={saving}
          users={users}
          invites={invites}
          selectedUserId={selectedUserId}
          onSelectedUserIdChange={setSelectedUserId}
          onAddUserInvite={addUserInvite}
          userInviteSaving={userInviteSaving}
        />

        <InviteList
          invites={invites}
          onResendInvite={resendInvite}
          onRemoveInvite={removeInvite}
        />
      </div>

      <InviteStatusSummary invites={invites} />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einladung entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Einladung wirklich entfernen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveInvite}>Entfernen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
