"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Share2, Users, Search, Check, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Invite {
  id: string;
  user: User;
  status: "pending" | "accepted" | "declined";
}

export default function EventSharePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [existingInvites, setExistingInvites] = useState<Invite[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Event und bestehende Einladungen laden
        const [eventRes, usersRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch('/api/users/shareable')
        ]);
        
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
          setExistingInvites(eventData.invites || []);
        }
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
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

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const alreadyInvitedUserIds = existingInvites.map(invite => invite.user.id);
  const availableUsers = filteredUsers.filter(user => 
    !alreadyInvitedUserIds.includes(user.id)
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    setSharing(true);
    try {
      const response = await fetch(`/api/events/${eventId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Teilen des Events');
      }

      const result = await response.json();
      alert(`Event erfolgreich mit ${result.invites.length} Usern geteilt!`);
      
      // Reset selection und reload data
      setSelectedUsers([]);
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
        setExistingInvites(eventData.invites || []);
      }
      
    } catch (error) {
      console.error('Share error:', error);
      alert('Fehler beim Teilen des Events');
    } finally {
      setSharing(false);
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
            <Share2 className="h-5 w-5" />
            Event teilen
          </CardTitle>
          <CardDescription>
            {event.title} • {new Date(event.eventDate).toLocaleDateString('de-DE')}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Auswahl */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User auswählen
            </CardTitle>
            <CardDescription>
              Wähle User aus, denen du das Event teilen möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">User suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name oder E-Mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {searchQuery ? "Keine User gefunden" : "Alle User bereits eingeladen"}
                </p>
              ) : (
                availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={user.id} className="font-medium cursor-pointer">
                        {user.name}
                      </Label>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Share Button */}
            <Button 
              onClick={handleShare} 
              disabled={sharing || selectedUsers.length === 0}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {sharing ? 'Wird geteilt...' : `Mit ${selectedUsers.length} Usern teilen`}
            </Button>
          </CardContent>
        </Card>

        {/* Bestehende Einladungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bereits eingeladen ({existingInvites.length})
            </CardTitle>
            <CardDescription>
              Übersicht aller bisherigen Einladungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingInvites.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Noch keine Einladungen vorhanden
              </p>
            ) : (
              <div className="space-y-3">
                {existingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                        {invite.user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{invite.user.name}</div>
                        <div className="text-sm text-gray-500">{invite.user.email}</div>
                      </div>
                    </div>
                    
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
          <CardTitle>Sharing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {existingInvites.filter(i => i.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Ausstehend</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {existingInvites.filter(i => i.status === "accepted").length}
              </div>
              <div className="text-sm text-gray-600">Zugesagt</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {existingInvites.filter(i => i.status === "declined").length}
              </div>
              <div className="text-sm text-gray-600">Abgelehnt</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
