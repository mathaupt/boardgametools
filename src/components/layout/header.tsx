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
    <header className="h-16 border-b bg-white/95 dark:bg-slate-950/85 supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-950/70 backdrop-blur flex items-center justify-between px-4 md:px-6 shadow-sm text-slate-900 dark:text-white">
      {/* Mobile Title - Hidden on desktop as Navbar shows it */}
      <div className="lg:hidden">
        <span className="font-bold text-lg">BoardGameTools</span>
      </div>
      
      {/* Spacer for desktop layout */}
      <div className="hidden lg:flex-1 lg:block" />
      
      {/* User Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-slate-600 dark:text-slate-100" />
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {user.name || user.email}
          </span>
        </div>

        {/* Mobile User Info */}
        <div className="md:hidden flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-slate-600 dark:text-slate-100" />
          <span className="truncate max-w-[140px] text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {user.name || user.email}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-slate-900 dark:text-white hover:bg-slate-900/5 dark:hover:bg-white/10"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Abmelden</span>
        </Button>
      </div>
    </header>
  );
}
