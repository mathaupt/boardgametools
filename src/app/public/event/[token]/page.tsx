import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Share2, Vote, Users } from "lucide-react";
import { PublicEventClient } from "@/components/public-event/public-event-client";

export const revalidate = 0;

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  const { token } = await params;

  const event = await findPublicEventByToken(
    token,
    buildPublicEventInclude(session?.user?.id)
  );

  if (!event || !event.isPublic) {
    notFound();
  }

  const serialized = serializePublicEvent(event, session?.user?.id ?? null);
  const eventDate = new Date(serialized.eventDate);
  const isPast = eventDate < new Date();

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                <Share2 className="h-4 w-4" /> Öffentliches Voting
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {serialized.title}
              </h1>
              {serialized.description && (
                <p className="mt-3 text-base text-slate-200/90">{serialized.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200/90">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {eventDate.toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {serialized.status !== "planning" && (
                    <span className="block text-xs text-slate-300/70">
                      {eventDate.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              </div>
              {serialized.location && (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <MapPin className="h-4 w-4" />
                  <span>{serialized.location}</span>
                </div>
              )}
              <Badge variant={isPast ? "secondary" : "default"} className="rounded-2xl px-3 py-2 text-xs">
                {isPast ? "Beendet" : "Aktiv"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border-white/10 bg-white/5 text-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Vote className="h-5 w-5" />
                Öffentlicher Event-Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <p>
                Teile diese Seite mit deinen Freunden. Sie können ohne Login als Gast teilnehmen,
                einen Spitznamen festlegen und direkt für Spielvorschläge abstimmen.
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-white/90">Event-ID</span>
                  <span className="break-all font-mono text-emerald-200/90">{serialized.id}</span>
                  <span className="font-semibold text-white/90">Freigabe-Token</span>
                  <span className="break-all font-mono text-emerald-200/90">{token}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Users className="h-5 w-5" />
                Öffentliche Teilnahme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <p>
                Gäste registrieren sich nur mit einem Nickname und können sofort mit abstimmen.
              </p>
              <p className="text-xs text-slate-400">
                Bereits registrierte Gäste: {serialized.guestParticipants.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <PublicEventClient token={token} event={serialized} />
        </div>
      </div>
    </div>
  );
}
