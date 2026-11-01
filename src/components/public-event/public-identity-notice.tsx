import Link from "next/link";
import type { PublicActor } from "@/lib/events/public-actor";

export function PublicIdentityNotice({ actor, sessionExpired = false }: { actor: PublicActor; sessionExpired?: boolean }) {
  if (actor.kind === "loading") {
    return <p className="text-sm text-muted-foreground" role="status">Teilnahme wird geladen …</p>;
  }

  if (actor.kind === "user") {
    return <p className="text-sm font-medium text-foreground">
      {actor.displayName ? `Du bist angemeldet als ${actor.displayName}.` : "Du bist angemeldet."}
    </p>;
  }

  if (actor.kind === "guest") {
    return <p className="text-sm font-medium text-foreground">Du nimmst als Gast {actor.nickname} teil.</p>;
  }

  if (sessionExpired) {
    return <p className="text-sm text-destructive" role="status">
      Deine Anmeldung ist abgelaufen. Bitte <Link className="font-medium underline underline-offset-4" href="/login">melde dich erneut an</Link>. Es wird kein Gastzugang verwendet.
    </p>;
  }

  return <p className="text-sm text-muted-foreground">
    Du kannst als Gast teilnehmen oder dich <Link className="font-medium text-primary underline underline-offset-4" href="/login">anmelden</Link>.
  </p>;
}
