import { CalendarDays, Gamepad2, Users } from "lucide-react";

interface PublicEventSectionLinksProps {
  hasGames: boolean;
  hasDates: boolean;
}

export function PublicEventSectionLinks({ hasGames, hasDates }: PublicEventSectionLinksProps) {
  const links = [
    ...(hasGames ? [{ href: "#event-games", label: "Spiele wählen", Icon: Gamepad2 }] : []),
    ...(hasDates ? [{ href: "#event-dates", label: "Termine beantworten", Icon: CalendarDays }] : []),
    { href: "#event-participants", label: "Teilnehmende", Icon: Users },
  ];

  return (
    <nav aria-label="Abschnitte dieser Veranstaltung" className="flex flex-wrap gap-2">
      {links.map(({ href, label, Icon }) => (
        <a key={href} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
