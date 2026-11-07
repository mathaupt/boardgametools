import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

export function ProfileAchievementLink() {
  return (
    <Link
      href="/dashboard/achievements"
      className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:px-5"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        <Award className="size-6" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">Abzeichen und Erfolge</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          Alle Abzeichen und ihre Freischaltbedingungen ansehen
        </span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
    </Link>
  );
}
