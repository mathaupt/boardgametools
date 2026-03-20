"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface CloseVotingButtonProps {
  eventId: string;
}

export default function CloseVotingButton({ eventId }: CloseVotingButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleClose = async () => {
    if (!confirm("Abstimmung wirklich beenden? Das Spiel mit den meisten Stimmen wird ausgewählt.")) {
      return;
    }

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
    <Button
      onClick={handleClose}
      disabled={loading}
      variant="destructive"
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      {loading ? "Wird beendet..." : "Abstimmung beenden"}
    </Button>
  );
}
