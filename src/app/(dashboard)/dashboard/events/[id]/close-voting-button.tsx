"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface CloseVotingButtonProps {
  eventId: string;
}

export default function CloseVotingButton({ eventId }: CloseVotingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleClose = async () => {
    setDialogOpen(false);
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/close`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Beenden der Abstimmung");
      }

      toast({
        title: "Abstimmung beendet",
        description: "Das Gewinnerspiel wurde ausgewählt.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        variant="destructive"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {loading ? "Wird beendet..." : "Abstimmung beenden"}
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abstimmung beenden</AlertDialogTitle>
            <AlertDialogDescription>
              Abstimmung wirklich beenden? Das Spiel mit den meisten Stimmen wird ausgewählt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>Beenden</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
