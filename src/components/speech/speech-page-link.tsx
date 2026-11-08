import NextLink from "next/link";
import type { ComponentProps } from "react";

/** Document-level microphone policies must also be applied after in-app navigation. */
export default function SpeechPageLink({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  const pathname = href.split(/[?#]/, 1)[0];
  if (pathname === "/dashboard/games" || pathname === "/dashboard/sessions/new") return <a {...props} href={href} />;
  return <NextLink {...props} href={href} />;
}
