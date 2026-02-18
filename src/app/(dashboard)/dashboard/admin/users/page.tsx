import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, User, Lock, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { CreateUserModal } from "@/components/admin/create-user-modal";
import { UserActions } from "@/components/admin/user-actions";

export default async function AdminUsersPage() {
  const session = await auth();
  
  // Check if user is admin
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          ownedGames: true,
          createdEvents: true,
          votes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nutzerverwaltung</h1>
          <p className="text-muted-foreground">Verwalte alle Benutzerkonten</p>
        </div>
        <CreateUserModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alle Benutzer ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive ? "outline" : "destructive"}>
                        {user.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <span>•</span>
                      <span>Seit {user.createdAt.toLocaleDateString("de-DE")}</span>
                      <span>•</span>
                      <span>{user._count.ownedGames} Spiele</span>
                      <span>•</span>
                      <span>{user._count.createdEvents} Events</span>
                      <span>•</span>
                      <span>{user._count.votes} Votes</span>
                    </div>
                  </div>
                </div>

                <UserActions user={user} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
