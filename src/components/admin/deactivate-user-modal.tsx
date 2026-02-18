"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeactivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  isActive: boolean;
}

export function DeactivateUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  isActive,
}: DeactivateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isActive: !isActive, // Toggle status
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Ändern des Benutzerstatus");
      } else {
        onClose();
        // Page reload to show updated status
        window.location.reload();
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {isActive ? "Benutzer deaktivieren" : "Benutzer aktivieren"}
          </DialogTitle>
          <DialogDescription>
            {isActive ? (
              <>
                Möchten Sie <strong>{userName}</strong> ({userEmail}) wirklich deaktivieren?
                Der Benutzer kann sich danach nicht mehr anmelden.
              </>
            ) : (
              <>
                Möchten Sie <strong>{userName}</strong> ({userEmail}) wirklich aktivieren?
                Der Benutzer kann sich danach wieder anmelden.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant={isActive ? "destructive" : "default"}
              disabled={isLoading}
            >
              {isLoading
                ? "Wird verarbeitet..."
                : isActive
                ? "Deaktivieren"
                : "Aktivieren"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
