"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  UserX,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

interface Anomaly {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  details: Record<string, unknown>;
  detectedAt: string;
}

export interface AnomaliesData {
  anomalies: Anomaly[];
  healthScore: number;
  checkedAt: string;
}

// ── Helper Components ───────────────────────────────────────────

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  if (severity === "high") return <Badge variant="destructive">Hoch</Badge>;
  if (severity === "medium") return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">Mittel</Badge>;
  return <Badge variant="secondary">Niedrig</Badge>;
}

function AnomalyIcon({ type }: { type: string }) {
  switch (type) {
    case "error-rate":
    case "error-spike":
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case "slow-endpoint":
      return <Clock className="h-5 w-5 text-amber-600" />;
    case "auth-failures":
      return <Shield className="h-5 w-5 text-amber-600" />;
    case "unusual-activity":
      return <UserX className="h-5 w-5 text-muted-foreground" />;
    case "server-errors":
      return <Zap className="h-5 w-5 text-destructive" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
}

// ── Component ───────────────────────────────────────────────────

export function AnomaliesTab({
  anomalies,
  anomaliesLoading,
}: {
  anomalies: AnomaliesData | null;
  anomaliesLoading: boolean;
}) {
  return (
    <TabsContent value="anomalies" className="space-y-6">
          {anomaliesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : anomalies ? (
            <>
              {/* Health Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                    <div className={cn(
                      "flex items-center justify-center w-24 h-24 rounded-full border-4",
                      anomalies.healthScore >= 80
                        ? "border-emerald-500 text-emerald-600"
                        : anomalies.healthScore >= 50
                          ? "border-amber-500 text-amber-600"
                          : "border-destructive text-destructive"
                    )}>
                      <span className="text-3xl font-bold">{anomalies.healthScore}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Health Score
                      </h3>
                      <p className="text-muted-foreground">
                        {anomalies.healthScore >= 80
                          ? "Gesund — Keine kritischen Probleme erkannt."
                          : anomalies.healthScore >= 50
                            ? "Auffällig — Einige Probleme erfordern Aufmerksamkeit."
                            : "Kritisch — Sofortige Maßnahmen empfohlen."}
                      </p>
                      <Badge
                        className={cn(
                          "mt-2",
                          anomalies.healthScore >= 80
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : anomalies.healthScore >= 50
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {anomalies.healthScore >= 80
                          ? "Gesund"
                          : anomalies.healthScore >= 50
                            ? "Auffällig"
                            : "Kritisch"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Anomaly List */}
              {anomalies.anomalies.length > 0 ? (
                <div className="space-y-4">
                  {anomalies.anomalies.map((anomaly) => (
                    <Card key={anomaly.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <AnomalyIcon type={anomaly.type} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-foreground">
                                {anomaly.title}
                              </h4>
                              <SeverityBadge severity={anomaly.severity} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {anomaly.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <CheckCircle className="h-12 w-12 text-emerald-500" />
                      <p className="text-lg font-medium text-foreground">
                        Keine Anomalien erkannt
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Alle Systeme laufen im normalen Bereich.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Fehler beim Laden der Anomalie-Daten.</p>
          )}
        </TabsContent>
  );
}
