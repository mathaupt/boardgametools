import { auth } from "@/lib/auth";

const MUTATION_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // --- CSRF protection for mutation requests (Origin / Sec-Fetch-Site verification) ---
  // Session cookies are SameSite=Lax by default, which already blocks cross-site POSTs.
  // This layer adds defense-in-depth for same-site/subdomain and header-spoofing scenarios.
  if (
    MUTATION_METHODS.includes(req.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") && // NextAuth has its own CSRF
    !pathname.startsWith("/api/public/") && // Public endpoints are token-based, not cookie-auth
    !pathname.startsWith("/api/mobile/v1/public/")
  ) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      // API-token requests are not vulnerable to browser CSRF
      return;
    }

    const expectedOrigin = req.nextUrl.origin;
    const secFetchSite = req.headers.get("sec-fetch-site");

    // Modern browsers signal the relationship between the request's origin and the target.
    if (secFetchSite === "same-origin") {
      return;
    }

    // Cross-site requests are blocked outright (SameSite=Lax is the primary defense).
    if (secFetchSite === "cross-site") {
      return Response.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");

    if (origin) {
      if (origin !== expectedOrigin) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
      return;
    }

    if (referer) {
      if (!referer.startsWith(expectedOrigin)) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
      return;
    }

    // Fallback for clients that do not send Origin/Referer/Sec-Fetch-Site:
    // only accept if the Host header matches the expected origin hostname.
    const hostWithoutPort = host?.split(":")[0];
    const expectedHostWithoutPort = new URL(expectedOrigin).hostname;
    if (hostWithoutPort !== expectedHostWithoutPort) {
      return Response.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  // Protect dashboard routes — redirect to login
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Allow public health check
  if (pathname === "/api/health") return;

  // Protect authenticated API routes
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/public/") &&
    !pathname.startsWith("/api/mobile/v1/") &&
    !pathname.startsWith("/api/bgg")
  ) {
    if (pathname.startsWith("/api/admin")) {
      if (!isLoggedIn) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (req.auth?.user?.role !== "ADMIN") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (
      !pathname.startsWith("/api/debug") &&
      !pathname.startsWith("/api/db/") &&
      !isLoggedIn
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth|_next).*)",
  ],
};
