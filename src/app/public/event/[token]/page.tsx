import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { PublicEventClient } from "@/components/public-event/public-event-client";
import { PublicEventHeader } from "@/components/public-event/public-event-header";

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

  if (!event || !event.isPublic) notFound();

  const serialized = serializePublicEvent(
    event,
    session?.user?.id ?? null,
    new Date(),
    session?.user?.name ?? null
  );

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-8 text-foreground sm:py-12">
      <div className="mx-auto w-full max-w-6xl px-4 max-[320px]:px-2 sm:px-6 lg:px-8">
        <PublicEventHeader event={serialized} />
        <div className="mt-6 sm:mt-8">
          <PublicEventClient token={token} event={serialized} />
        </div>
      </div>
    </div>
  );
}
