"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Globe, Link as LinkIcon, Loader2, RefreshCcw } from "lucide-react";

interface PublicShareCardProps {
  eventId: string;
  initialShareToken: string | null;
  initialIsPublic: boolean;
  initialPublicUrl: string | null;
  canManage: boolean;
}

export function PublicShareCard({
  eventId,
  initialShareToken,
  initialIsPublic,
  initialPublicUrl,
  canManage,
}: PublicShareCardProps) {
  const { toast } = useToast();
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [publicUrl, setPublicUrl] = useState(initialPublicUrl);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const statusLabel = useMemo(() => {
    if (!isPublic || !publicUrl) return "Nicht veröffentlicht";
    return "Öffentlich";
  }, [isPublic, publicUrl]);

  const handlePublish = async () => {
    if (!canManage) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Event konnte nicht veröffentlicht werden");
      }
      const data: { shareToken: string; publicUrl: string } = await response.json();
      setShareToken(data.shareToken);
      setPublicUrl(data.publicUrl);
      setIsPublic(true);
      toast({
        title: "Event veröffentlicht",
        description: "Der öffentliche Link ist jetzt aktiv.",
      });
    } catch (error) {
      console.error("Publish public event error", error);
      toast({
        title: "Fehler beim Veröffentlichen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    setIsCopying(true);
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const input = document.createElement("input");
        input.value = publicUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast({ title: "Link kopiert", description: "Der öffentliche Link wurde in die Zwischenablage kopiert." });
    } catch (error) {
      console.error("Copy link error", error);
      toast({
        title: "Kopieren fehlgeschlagen",
        description: "Bitte kopiere den Link manuell.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          Öffentlicher Event-Link
        </CardTitle>
        <CardDescription>
          Teile einen öffentlichen Link mit Gästen ohne Account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isPublic && publicUrl ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
          {shareToken && (
            <span className="text-xs text-muted-foreground">Token: {shareToken}</span>
          )}
        </div>

        {!canManage && (
          <p className="text-xs text-muted-foreground">
            Nur Organisator:innen können den öffentlichen Link erstellen oder erneuern.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="public-link">
            Öffentlicher Link
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="public-link"
              readOnly
              value={publicUrl ?? "Noch kein Link generiert"}
              className="bg-muted/40"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!publicUrl || isCopying}
                onClick={handleCopy}
                data-testid="copy-public-link"
              >
                {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Kopieren</span>
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || !canManage}
                data-testid="publish-public-link"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : publicUrl ? (
                  <RefreshCcw className="h-4 w-4" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {publicUrl ? "Link erneuern" : "Link erstellen"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
