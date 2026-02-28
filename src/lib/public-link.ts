/**
 * Server-side base URL resolution.
 * Uses NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > VERCEL_URL > localhost fallback.
 */
export function getPublicBaseUrl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return base?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Client-side base URL resolution.
 * Uses window.location.origin so the link always matches the current domain.
 */
export function getClientBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getPublicBaseUrl();
}
