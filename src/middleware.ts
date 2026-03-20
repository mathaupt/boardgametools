import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

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
    // Admin routes require admin role
    if (pathname.startsWith("/api/admin")) {
      if (!isLoggedIn) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (req.auth?.user?.role !== "ADMIN") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Other protected API routes require authentication
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
