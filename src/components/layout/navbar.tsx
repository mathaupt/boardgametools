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
  Shield,
  Library,
  LogOut,
  User,
  HelpCircle,
  Activity,
  FileCode,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { currentVersion } from "@/lib/changelog";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Spiele", href: "/dashboard/games", icon: Gamepad2 },
  { name: "Sessions", href: "/dashboard/sessions", icon: CalendarDays },
  { name: "Reihen", href: "/dashboard/series", icon: Library },
  { name: "Events", href: "/dashboard/events", icon: Vote },
  { name: "Gruppen", href: "/dashboard/groups", icon: Users },
  { name: "Statistiken", href: "/dashboard/statistics", icon: BarChart3 },
  { name: "FAQ", href: "/dashboard/faq", icon: HelpCircle },
];

const adminNavigation = [
  { name: "Nutzerverwaltung", href: "/dashboard/admin/users", icon: Shield },
  { name: "Monitoring", href: "/dashboard/admin/monitoring", icon: Activity },
  { name: "API-Docs", href: "/dashboard/admin/api-docs", icon: FileCode },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 px-3">
        {/* Logo */}
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className="mr-1 flex shrink-0 items-center gap-2 no-underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Dice6 className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
          </div>
        </Link>

        {/* Version badge */}
        <Link
          href="/dashboard/changelog"
          aria-label={`Versionshistorie v${currentVersion}`}
          className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-muted-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          suppressHydrationWarning
        >
          v{currentVersion}
        </Link>

        {/* Navigation links - always visible, horizontal scroll on small screens */}
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={cn(
                  "navbar-link flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-[7px] text-[13px] font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "navbar-link-active bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="mx-1 h-6 w-px shrink-0 bg-border" />
              {adminNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-[7px] text-[13px] font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="nav-label">{item.name}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {session?.user && (
            <>
              <Link
                href="/dashboard/profile"
                aria-label="Mein Profil"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname.startsWith("/dashboard/profile")
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    pathname.startsWith("/dashboard/profile")
                      ? "bg-primary/15"
                      : "bg-primary/10"
                  )}
                >
                  <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="nav-label font-medium">
                  {session.user.name || session.user.email}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Abmelden"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
