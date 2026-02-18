"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, MapPin, Users, Mail } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    inviteEmails: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inviteEmails = formData.inviteEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventDate: new Date(formData.eventDate).toISOString(),
          inviteEmails: inviteEmails.length > 0 ? inviteEmails : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Events');
      }

      const newEvent = await response.json();
      router.push(`/dashboard/events/${newEvent.id}`);
      
    } catch (error) {
      console.error('Create error:', error);
      alert('Fehler beim Erstellen des Events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/events")}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Events
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Neues Event erstellen</h1>
        <p className="text-muted-foreground">Plane einen neuen Spieleabend mit Voting-System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Grundlegende Informationen zum Event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Titel *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="z.B. Spieleabend bei Max"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Beschreibung des Events, besondere Anmerkungen, etc."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Datum *</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Ort</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="z.B. Bei Max zu Hause, Spielecafé XYZ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Einladungen
            </CardTitle>
            <CardDescription>
              Lade andere Spieler per E-Mail ein (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="inviteEmails">E-Mail Adressen</Label>
              <Textarea
                id="inviteEmails"
                name="inviteEmails"
                value={formData.inviteEmails}
                onChange={handleChange}
                placeholder="max@example.com, anna@example.com, tom@example.com"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Kommagetrennte Liste von E-Mail Adressen. Eingeladene User erhalten eine Benachrichtigung.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/events')}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Wird erstellt...' : 'Event erstellen'}
          </Button>
        </div>
      </form>
    </div>
  );
}
