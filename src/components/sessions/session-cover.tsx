"use client";

import Image from "next/image";
import { Dice6 } from "lucide-react";
import { useState } from "react";
import { getSessionCoverSource } from "@/components/sessions/session-cover-source";

export function SessionCover({ imageUrl }: { imageUrl: string | null }) {
  const source = getSessionCoverSource(imageUrl);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = source !== null && failedSource !== source;

  return (
    <div
      className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary text-secondary-foreground sm:size-14"
      aria-hidden="true"
    >
      {showImage ? (
        <Image
          src={source}
          alt=""
          width={56}
          height={56}
          sizes="(max-width: 640px) 48px, 56px"
          className="h-full w-full object-contain"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <Dice6 className="size-5 text-muted-foreground sm:size-6" />
      )}
    </div>
  );
}
