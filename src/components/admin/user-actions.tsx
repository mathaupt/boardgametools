"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/components/admin/change-password-modal";
import { DeactivateUserModal } from "@/components/admin/deactivate-user-modal";
import { Lock, Power, PowerOff } from "lucide-react";

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          PW ändern
        </Button>
        
        <Button
          variant={user.isActive ? "outline" : "default"}
          size="sm"
          onClick={() => setIsDeactivateModalOpen(true)}
          className="flex items-center gap-2"
        >
          {user.isActive ? (
            <>
              <PowerOff className="h-4 w-4" />
              Deaktivieren
            </>
          ) : (
            <>
              <Power className="h-4 w-4" />
              Aktivieren
            </>
          )}
        </Button>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
      />

      <DeactivateUserModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        isActive={user.isActive}
      />
    </>
  );
}
