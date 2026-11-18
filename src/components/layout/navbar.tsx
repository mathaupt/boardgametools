"use client";

import { useRef, useState } from "react";
import Link from "@/components/speech/speech-page-link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Dice6, LayoutDashboard, Gamepad2, CalendarDays, Users, BarChart3, Shield, Library, LogOut, HelpCircle, Activity, FileCode, Menu, X, Award, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentVersion } from "@/lib/changelog";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Spiele", href: "/dashboard/games", icon: Gamepad2 },
  { name: "Sessions", href: "/dashboard/sessions", icon: CalendarDays },
  { name: "Spieleabende", href: "/dashboard/events", icon: CalendarDays },
  { name: "Gruppen", href: "/dashboard/groups", icon: Users },
];
const moreNavigation = [
  { name: "Reihen", href: "/dashboard/series", icon: Library },
  { name: "Statistiken", href: "/dashboard/statistics", icon: BarChart3 },
  { name: "Abzeichen", href: "/dashboard/achievements", icon: Award },
];
const adminNavigation = [
  { name: "Nutzerverwaltung", href: "/dashboard/admin/users", icon: Shield },
  { name: "Monitoring", href: "/dashboard/admin/monitoring", icon: Activity },
  { name: "API-Docs", href: "/dashboard/admin/api-docs", icon: FileCode },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const moreToggle = useRef<HTMLButtonElement>(null);
  const isAdmin = session?.user?.role === "ADMIN";
  const activeMoreItem = moreNavigation.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const close = () => setOpen(false);

  return (
    <header className="club-navigation" onKeyDown={(event) => {
      if (event.key === "Escape" && moreOpen) { setMoreOpen(false); moreToggle.current?.focus(); }
      else if (event.key === "Escape" && open) { close(); toggle.current?.focus(); }
    }}>
      <div className="club-brand-row">
        <Link href="/dashboard" className="club-brand" onClick={close}>
          <Dice6 className="size-6 shrink-0" aria-hidden="true" />
          <span>BoardGameTools</span>
        </Link>
        <button ref={toggle} type="button" className="club-menu-toggle" aria-controls="club-navigation-links" aria-expanded={open} aria-label={open ? "Menü schließen" : "Menü öffnen"} onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <div id="club-navigation-links" className={cn("club-navigation-body", open && "is-open")}>
        <nav aria-label="Hauptnavigation" className="club-nav-links">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return <Link key={item.href} href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={cn("club-nav-link", active && "is-active")}>
              <item.icon className="size-[18px] shrink-0" aria-hidden="true" />{item.name}
            </Link>;
          })}
          <div className="relative">
            <button ref={moreToggle} type="button" className={cn("club-nav-link w-full", activeMoreItem && "is-active")} aria-label={activeMoreItem ? `Mehr, ${activeMoreItem.name}` : "Mehr"} aria-expanded={moreOpen} aria-controls="club-more-links" onClick={() => setMoreOpen((value) => !value)}>
              <span>Mehr</span><ChevronDown className={cn("ml-auto size-4 transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
            </button>
            {moreOpen && <div id="club-more-links" className="flex flex-col gap-1 pl-3" aria-label="Weitere Bereiche">
              {moreNavigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return <Link key={item.href} href={item.href} onClick={() => { close(); setMoreOpen(false); }} aria-current={active ? "page" : undefined} className={cn("club-nav-link", active && "is-active")}>
                  <item.icon className="size-[18px] shrink-0" aria-hidden="true" />{item.name}
                </Link>;
              })}
            </div>}
          </div>
          {isAdmin && <div className="club-admin-links">
            <p className="px-3 pb-2 text-sm font-semibold">Administration</p>
            {adminNavigation.map((item) => <Link key={item.href} href={item.href} onClick={close} className="club-nav-link" aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
              <item.icon className="size-[18px] shrink-0" aria-hidden="true" />{item.name}
            </Link>)}
          </div>}
        </nav>
        <div className="club-nav-footer">
          <Link href="/dashboard/faq" className="club-nav-link" onClick={close}><HelpCircle className="size-[18px]" aria-hidden="true" />Hilfe & FAQ</Link>
          <Link href="/dashboard/changelog" className="club-nav-link" onClick={close}>Versionshistorie <span className="ml-auto text-xs">v{currentVersion}</span></Link>
          {session?.user && <Link href="/dashboard/profile" className="club-profile" onClick={close}>
            <span className="club-avatar" aria-hidden="true">{(session.user.name || session.user.email || "?").slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0"><span className="block truncate font-semibold">{session.user.name || session.user.email}</span><span className="text-sm">Mein Profil</span></span>
          </Link>}
          <button type="button" className="club-nav-link w-full" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="size-[18px]" aria-hidden="true" />Abmelden</button>
        </div>
      </div>
    </header>
  );
}
