/**
 * Server-side base URL resolution.
 * Priority: NEXT_PUBLIC_APP_URL > request Host header > NEXTAUTH_URL > VERCEL_URL > localhost.
 */
export async function getPublicBaseUrl() {
  // 1. Explicit env var always wins
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Derive from the incoming request Host header (works for any domain)
  //    Dynamic import so this module stays compatible with client components.
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() may throw outside of a request context (e.g. build time)
  }

  // 3. Fallback chain
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Client-side base URL resolution.
 * Uses window.location.origin so the link always matches the current domain.
 */
export function getClientBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR – env-based only (no headers available)
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  );
}
