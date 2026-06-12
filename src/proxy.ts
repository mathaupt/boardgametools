import { auth } from "@/lib/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // --- CSRF protection for mutation requests (Origin verification) ---
  if (
    MUTATION_METHODS.has(req.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") && // NextAuth has its own CSRF
    !pathname.startsWith("/api/public/") // Public endpoints don't require CSRF
  ) {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    const expectedOrigin = req.nextUrl.origin;

    // Skip CSRF validation for same-origin requests (browser requests from same domain)
    // Check if request is from same origin by comparing host header
    const isSameOrigin = host === new URL(expectedOrigin).host;
    
    if (isSameOrigin) {
      // Same-origin requests are safe - skip CSRF validation
      return;
    }

    // For cross-origin requests, require Origin to match
    if (origin) {
      if (origin !== expectedOrigin) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    } else if (referer) {
      // Fallback: check Referer when Origin is absent
      if (!referer.startsWith(expectedOrigin)) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    } else {
      // Cross-origin request without Origin or Referer - reject
      return Response.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  // Protect dashboard routes — redirect to login
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Protect authenticated API routes
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/public/") &&
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
