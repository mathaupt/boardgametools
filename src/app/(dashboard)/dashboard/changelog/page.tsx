import { changelog } from "@/lib/changelog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Wrench, TrendingUp, Settings } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600; // ISR: 1 hour – data from static TS file, only changes on deploy

const typeConfig = {
  feature: { label: "Neu", icon: Sparkles, variant: "default" as const },
  fix: { label: "Fix", icon: Wrench, variant: "destructive" as const },
  improvement: { label: "Verbessert", icon: TrendingUp, variant: "secondary" as const },
  internal: { label: "Intern", icon: Settings, variant: "outline" as const },
};

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Versionshistorie</h1>
        <p className="mt-1 text-muted-foreground">
          Alle Neuerungen und Verbesserungen im Überblick.
        </p>
      </div>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div
          className="absolute left-[19px] top-6 bottom-6 w-px bg-border"
          aria-hidden="true"
        />

        {changelog.map((entry, index) => (
          <div key={entry.version} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline dot */}
            <div
              className={`relative z-10 mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                index === 0
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {entry.version.split(".").slice(1).join(".")}
            </div>

            {/* Content */}
            <Card className="flex-1 border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-lg text-foreground">
                    {entry.title}
                  </CardTitle>
                  <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                    v{entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {entry.changes.map((change, ci) => {
                    const config = typeConfig[change.type];
                    const Icon = config.icon;
                    return (
                      <li key={ci} className="flex items-start gap-2 text-sm">
                        <Badge
                          variant={config.variant}
                          className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0"
                        >
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-foreground">{change.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
