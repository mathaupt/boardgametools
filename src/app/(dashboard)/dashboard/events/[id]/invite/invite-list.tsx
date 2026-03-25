"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Users, Check, X } from "lucide-react";

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

interface InviteListProps {
  invites: Invite[];
  onResendInvite: (inviteId: string) => void;
  onRemoveInvite: (inviteId: string) => void;
}

export function InviteList({ invites, onResendInvite, onRemoveInvite }: InviteListProps) {
  return (
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
                        onClick={() => onResendInvite(invite.id!)}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveInvite(invite.id!)}
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
  );
}

interface InviteStatusSummaryProps {
  invites: Invite[];
}

export function InviteStatusSummary({ invites }: InviteStatusSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Einladungs-Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-success">
              {invites.filter((i) => i.status === "accepted").length}
            </div>
            <div className="text-sm text-muted-foreground">Zugesagt</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-warning">
              {invites.filter((i) => i.status === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Ausstehend</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-destructive">
              {invites.filter((i) => i.status === "declined").length}
            </div>
            <div className="text-sm text-muted-foreground">Abgelehnt</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
