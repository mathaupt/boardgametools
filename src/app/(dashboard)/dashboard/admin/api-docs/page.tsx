import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, FileCode } from "lucide-react";
import Link from "next/link";
import { SwaggerViewer } from "./swagger-viewer";

export default async function ApiDocsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/monitoring"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Monitoring
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <FileCode className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            API-Dokumentation
          </h1>
          <p className="text-muted-foreground">
            OpenAPI 3.1 Spezifikation — 71 Endpunkte, 18 Tags
          </p>
        </div>
      </div>

      <SwaggerViewer />
    </div>
  );
}
