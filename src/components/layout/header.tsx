"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6">
      {/* Mobile Title - Hidden on desktop as Navbar shows it */}
      <div className="lg:hidden">
        <span className="font-bold text-lg">BoardGameTools</span>
      </div>
      
      {/* Spacer for desktop layout */}
      <div className="hidden lg:flex-1 lg:block" />
      
      {/* User Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{user.name || user.email}</span>
        </div>
        
        {/* Mobile User Info */}
        <div className="md:hidden flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground truncate max-w-[120px]">
            {user.name || user.email}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Abmelden</span>
        </Button>
      </div>
    </header>
  );
}
