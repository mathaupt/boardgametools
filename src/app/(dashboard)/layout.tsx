import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
        {/* Top Navigation Bar */}
        <Navbar />
        
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Header user={session.user} />
            <main className="flex-1 p-4 md:p-6 bg-muted/30">{children}</main>
          </div>
        </div>
        <Toaster />
      </div>
    </SessionProvider>
  );
}
