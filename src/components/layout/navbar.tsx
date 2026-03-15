"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dice6,
  LayoutDashboard,
  Gamepad2,
  CalendarDays,
  Users,
  BarChart3,
  Vote,
  Menu,
  X,
  Shield,
  Library,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Spiele", href: "/dashboard/games", icon: Gamepad2 },
  { name: "Sessions", href: "/dashboard/sessions", icon: CalendarDays },
  { name: "Reihen", href: "/dashboard/series", icon: Library },
  { name: "Events", href: "/dashboard/events", icon: Vote },
  { name: "Gruppen", href: "/dashboard/groups", icon: Users },
  { name: "Statistiken", href: "/dashboard/statistics", icon: BarChart3 },
];

const adminNavigation = [
  { name: "Nutzerverwaltung", href: "/dashboard/admin/users", icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Dice6 className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground hidden lg:inline">BoardGameTools</span>
            <span className="font-bold text-lg text-foreground lg:hidden">BGT</span>
          </Link>

          {/* Desktop Navigation - static horizontal, visible on md+ */}
          <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={item.name}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      title={item.name}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="ml-auto md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 p-0"
              aria-label="Navigation umschalten"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <nav className="container mx-auto px-4 pb-4 pt-2 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="border-t border-border mt-2 pt-3">
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Administration
                  </p>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
