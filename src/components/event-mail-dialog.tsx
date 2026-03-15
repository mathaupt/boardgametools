"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, Bell, Loader2, CheckCircle, AlertCircle, Users } from "lucide-react";

interface EventMailDialogProps {
  eventId: string;
  eventTitle: string;
  totalInvites: number;
  acceptedCount: number;
}

export function EventMailDialog({ eventId, eventTitle, totalInvites, acceptedCount }: EventMailDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`${eventTitle} – Nachricht vom Organisator`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  async function handleSend(type: "custom" | "reminder") {
    setSending(true);
    setResult(null);

    try {
      const res = await fetch(`/api/events/${eventId}/mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(type === "custom" ? { subject: subject.trim(), message } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, text: data.error || "Fehler beim Senden" });
        return;
      }

      setResult({ success: true, text: data.message });
      if (type === "custom") setMessage("");
    } catch {
      setResult({ success: false, text: "Netzwerkfehler beim Senden" });
    } finally {
      setSending(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setResult(null);
    }
  }

  // Organisator wird bei custom nicht mitgezählt -> totalInvites - 1
  const customRecipients = Math.max(0, totalInvites - 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Nachricht
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Teilnehmer anschreiben
          </DialogTitle>
          <DialogDescription>
            Sende eine Nachricht oder Erinnerung an die Teilnehmer dieses Events.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="custom" className="flex-1">
              <Send className="h-4 w-4 mr-1" />
              Nachricht
            </TabsTrigger>
            <TabsTrigger value="reminder" className="flex-1">
              <Bell className="h-4 w-4 mr-1" />
              Erinnerung
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Wird an <strong className="text-foreground">{customRecipients}</strong> eingeladene
                Personen gesendet (alle ausser dir)
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mail-subject">Betreff</Label>
              <Input
                id="mail-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff der E-Mail"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mail-message">Nachricht</Label>
              <Textarea
                id="mail-message"
                placeholder="Deine Nachricht an alle Teilnehmer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
            <Button
              onClick={() => handleSend("custom")}
              disabled={sending || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Nachricht senden
            </Button>
          </TabsContent>

          <TabsContent value="reminder" className="space-y-4 pt-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  Wird an <strong className="text-foreground">{acceptedCount}</strong> zugesagte
                  Teilnehmer gesendet
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sendet eine freundliche Erinnerung an alle Personen, die bereits zugesagt haben, mit
                Datum, Uhrzeit und Ort des Spieleabends.
              </p>
            </div>
            {acceptedCount === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Noch niemand hat zugesagt. Erinnerungen werden nur an zugesagte Teilnehmer
                  verschickt.
                </p>
              </div>
            ) : (
              <Button
                onClick={() => handleSend("reminder")}
                disabled={sending}
                className="w-full"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Erinnerung senden
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {result && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              result.success
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {result.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
