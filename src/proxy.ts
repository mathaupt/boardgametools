import { auth } from "@/lib/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // --- CSRF protection for mutation requests (Origin verification) ---
  if (
    MUTATION_METHODS.has(req.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") // NextAuth has its own CSRF
  ) {
    const origin = req.headers.get("origin");
    const expectedOrigin = req.nextUrl.origin;

    if (origin) {
      if (origin !== expectedOrigin) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    } else {
      // Fallback: check Referer when Origin is absent (e.g. same-origin navigation)
      const referer = req.headers.get("referer");
      if (referer && !referer.startsWith(expectedOrigin)) {
        return Response.json({ error: "CSRF validation failed" }, { status: 403 });
      }
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
