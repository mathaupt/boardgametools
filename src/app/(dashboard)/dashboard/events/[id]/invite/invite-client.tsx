"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddInviteForm } from "./add-invite-form";
import { InviteList, InviteStatusSummary } from "./invite-list";

interface Invite {
  id?: string; email?: string; userId?: string;
  user?: { id: string; name: string; email: string };
  status: "pending" | "accepted" | "declined";
}

interface UserOption { id: string; name: string; email: string; }
interface EventData { title: string; eventDate: string; invites: Invite[]; }

interface InviteClientProps {
  initialEvent: EventData;
  initialUsers: UserOption[];
  eventId: string;
}

export default function InviteClient({ initialEvent, initialUsers, eventId }: InviteClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [event] = useState<EventData>(initialEvent);
  const [invites, setInvites] = useState<Invite[]>(initialEvent.invites || []);
  const [newEmail, setNewEmail] = useState("");
  const [users] = useState<UserOption[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [userInviteSaving, setUserInviteSaving] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const addInvite = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Fehler"); }
      const newInvite = await res.json();
      setInvites((prev) => [...prev, newInvite]);
      setNewEmail("");
    } catch (error) {
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Fehler", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const addUserInvite = async () => {
    if (!selectedUserId) return;
    setUserInviteSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Fehler"); }
      const newUserInvite = await res.json();
      setInvites((prev) => [...prev, newUserInvite]);
      setSelectedUserId("");
    } catch (error) {
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Fehler", variant: "destructive" });
    } finally { setUserInviteSaving(false); }
  };

  const removeInvite = (inviteId: string) => { setPendingRemoveId(inviteId); setRemoveDialogOpen(true); };

  const confirmRemoveInvite = async () => {
    if (!pendingRemoveId) return;
    setRemoveDialogOpen(false);
    try {
      const res = await fetch(`/api/events/${eventId}/invites?inviteId=${pendingRemoveId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler");
      setInvites((prev) => prev.filter((i) => i.id !== pendingRemoveId));
    } catch (_error) {
      toast({ title: "Fehler", description: "Fehler beim Entfernen", variant: "destructive" });
    } finally { setPendingRemoveId(null); }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/invites/resend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!res.ok) throw new Error("Fehler");
      toast({ title: "Erinnerung gesendet" });
    } catch {
      toast({ title: "Fehler", description: "Fehler beim Senden", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/dashboard/events/${eventId}`)} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />Zurueck zum Event
        </button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Einladungen verwalten</CardTitle>
          <CardDescription>{event.title} - {new Date(event.eventDate).toLocaleDateString("de-DE")}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddInviteForm newEmail={newEmail} onNewEmailChange={setNewEmail} onAddInvite={addInvite} saving={saving} users={users} invites={invites} selectedUserId={selectedUserId} onSelectedUserIdChange={setSelectedUserId} onAddUserInvite={addUserInvite} userInviteSaving={userInviteSaving} />
        <InviteList invites={invites} onResendInvite={resendInvite} onRemoveInvite={removeInvite} />
      </div>
      <InviteStatusSummary invites={invites} />
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Einladung entfernen</AlertDialogTitle><AlertDialogDescription>Moechtest du diese Einladung wirklich entfernen?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction onClick={confirmRemoveInvite}>Entfernen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
