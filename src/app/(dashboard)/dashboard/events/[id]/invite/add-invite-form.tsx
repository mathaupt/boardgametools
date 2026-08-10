"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Invite {
  id?: string;
  userId?: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface AddInviteFormProps {
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onAddInvite: () => void;
  saving: boolean;
  users: UserOption[];
  invites: Invite[];
  selectedUserId: string;
  onSelectedUserIdChange: (value: string) => void;
  onAddUserInvite: () => void;
  userInviteSaving: boolean;
}

export function AddInviteForm({
  newEmail,
  onNewEmailChange,
  onAddInvite,
  saving,
  users,
  invites,
  selectedUserId,
  onSelectedUserIdChange,
  onAddUserInvite,
  userInviteSaving,
}: AddInviteFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Neue Einladung</CardTitle>
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
              onChange={(e) => onNewEmailChange(e.target.value)}
              placeholder="max@example.com"
              onKeyDown={(e) => e.key === "Enter" && onAddInvite()}
            />
            <Button onClick={onAddInvite} disabled={saving || !newEmail.trim()} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {saving ? "Wird hinzugefügt…" : "Hinzufügen"}
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Label>Bestehenden Nutzer auswählen</Label>
          <div className="flex gap-2 mt-1">
            <Select value={selectedUserId} onValueChange={onSelectedUserIdChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Nutzer auswählen…" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((user) => !invites.some((inv) => inv.userId === user.id))
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onAddUserInvite}
              disabled={userInviteSaving || !selectedUserId}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {userInviteSaving ? "Wird hinzugefügt…" : "Einladen"}
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
  );
}
