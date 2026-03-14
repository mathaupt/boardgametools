"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center justify-end px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground hidden sm:inline">
            {user.name || user.email}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Abmelden"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline ml-1.5">Abmelden</span>
        </Button>
      </div>
    </header>
  );
}
