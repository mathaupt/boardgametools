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
  LogOut,
  User,
  HelpCircle,
  Activity,
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
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 12px",
          display: "flex",
          height: "56px",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            textDecoration: "none",
            marginRight: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "32px",
              width: "32px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              backgroundColor: "oklch(0.48 0.2 265 / 0.1)",
            }}
          >
            <Dice6
              style={{ height: "18px", width: "18px", color: "var(--primary)" }}
            />
          </div>
        </Link>

        {/* Version badge */}
        <Link
          href="/dashboard/changelog"
          title="Versionshistorie"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--muted-foreground)",
            backgroundColor: "var(--muted)",
            padding: "2px 6px",
            borderRadius: "4px",
            textDecoration: "none",
            flexShrink: 0,
            lineHeight: "16px",
          }}
        >
          v{currentVersion}
        </Link>

        {/* Navigation links - always visible, horizontal scroll on small screens */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            flex: "1 1 0%",
            minWidth: 0,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                className={cn(
                  "navbar-link",
                  isActive && "navbar-link-active"
                )}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  flexShrink: 0,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  color: isActive
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                  backgroundColor: isActive
                    ? "var(--primary)"
                    : "transparent",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                <item.icon style={{ height: "16px", width: "16px", flexShrink: 0 }} />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div
                style={{
                  width: "1px",
                  height: "24px",
                  backgroundColor: "var(--border)",
                  margin: "0 4px",
                  flexShrink: 0,
                }}
              />
              {adminNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    aria-label={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                      flexShrink: 0,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      color: isActive
                        ? "var(--primary-foreground)"
                        : "var(--muted-foreground)",
                      backgroundColor: isActive
                        ? "var(--primary)"
                        : "transparent",
                      transition: "background-color 0.15s, color 0.15s",
                    }}
                  >
                    <item.icon style={{ height: "16px", width: "16px", flexShrink: 0 }} />
                    <span className="nav-label">{item.name}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          {session?.user && (
            <>
              <Link
                href="/dashboard/profile"
                title="Mein Profil"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: pathname.startsWith("/dashboard/profile")
                    ? "var(--primary)"
                    : "var(--foreground)",
                  textDecoration: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: "28px",
                    width: "28px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: pathname.startsWith("/dashboard/profile")
                      ? "oklch(0.48 0.2 265 / 0.15)"
                      : "oklch(0.48 0.2 265 / 0.1)",
                  }}
                >
                  <User
                    style={{
                      height: "14px",
                      width: "14px",
                      color: "var(--primary)",
                    }}
                  />
                </div>
                <span className="nav-label" style={{ fontWeight: 500 }}>
                  {session.user.name || session.user.email}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Abmelden"
                aria-label="Abmelden"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                <LogOut style={{ height: "16px", width: "16px" }} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
