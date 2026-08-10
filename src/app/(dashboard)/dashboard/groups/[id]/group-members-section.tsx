"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Users, X, UserPlus } from "lucide-react";
import { SerializedGroupMember } from "@/types/group";

interface GroupMembersSectionProps {
  members: SerializedGroupMember[];
  isOwner: boolean;
  showAddMember: boolean;
  onToggleAddMember: () => void;
  memberEmail: string;
  onMemberEmailChange: (value: string) => void;
  memberError: string;
  onAddMember: (e: React.FormEvent) => void;
  onRemoveMember: (memberId: string) => void;
  loading: string;
}

export function GroupMembersSection({
  members,
  isOwner,
  showAddMember,
  onToggleAddMember,
  memberEmail,
  onMemberEmailChange,
  memberError,
  onAddMember,
  onRemoveMember,
  loading,
}: GroupMembersSectionProps) {
  const [removeTarget, setRemoveTarget] = useState<SerializedGroupMember | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle as="h2" className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mitglieder ({members.length})
            </CardTitle>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAddMember}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAddMember && (
          <form onSubmit={onAddMember} className="flex gap-2 mb-3">
            <Input
              placeholder="E-Mail-Adresse"
              aria-label="E-Mail-Adresse des neuen Mitglieds"
              value={memberEmail}
              onChange={(e) => onMemberEmailChange(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" type="submit" disabled={loading === "member"}>
              {loading === "member" ? "…" : "Einladen"}
            </Button>
          </form>
        )}
        {memberError && <p className="text-sm text-destructive">{memberError}</p>}
        {members.map((member: SerializedGroupMember) => (
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
                onClick={() => setRemoveTarget(member)}
                aria-label={`${member.user.name} entfernen`}
                disabled={loading === `remove-${member.user.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>

    <AlertDialog open={removeTarget !== null} onOpenChange={() => setRemoveTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mitglied entfernen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du {removeTarget?.user.name} wirklich aus der Gruppe entfernen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={() => setRemoveTarget(null)}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={removeTarget ? loading === `remove-${removeTarget.user.id}` : false}
            onClick={() => {
              if (removeTarget) {
                setRemoveTarget(null);
                onRemoveMember(removeTarget.user.id);
              }
            }}
          >
            Entfernen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
