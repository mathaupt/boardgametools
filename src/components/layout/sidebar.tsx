"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="w-64 hidden lg:flex flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-5 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <Dice6 className="h-5 w-5 text-sidebar-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
            BoardGameTools
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-label={`Navigate to ${item.name}`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-5 mt-3 border-t border-sidebar-border">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
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
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-4 mt-auto border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">
          BoardGameTools
        </p>
      </div>
    </aside>
  );
}
