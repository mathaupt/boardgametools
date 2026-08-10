import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
        >
          Zum Hauptinhalt springen
        </a>
        {/* Top Navigation Bar (includes user info) */}
        <Navbar />

        {/* Main Content */}
        <main id="main-content" aria-label="Hauptinhalt" className="flex-1 p-4 md:p-6 bg-muted/30" tabIndex={-1}>
          {children}
        </main>
        <Toaster />
      </div>
    </SessionProvider>
  );
}
