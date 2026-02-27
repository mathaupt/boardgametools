export function getPublicBaseUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  return base?.replace(/\/$/, "") || "http://localhost:3000";
}
