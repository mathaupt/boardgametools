import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MonitoringDashboard } from "./monitoring-dashboard";

export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Monitoring</h1>
        <p className="text-muted-foreground">
          API-Auslastung, Logs und Anomalie-Erkennung
        </p>
      </div>
      <MonitoringDashboard />
    </div>
  );
}
