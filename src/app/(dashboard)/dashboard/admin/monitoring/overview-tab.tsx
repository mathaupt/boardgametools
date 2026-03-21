"use client";

import {
  Activity,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

// ── Types ───────────────────────────────────────────────────────

interface StatsSummary {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  uniqueUsers: number;
}

export interface StatsData {
  summary: StatsSummary;
  requestsByHour: Array<{ hour: string; count: number; errors: number }>;
  topEndpoints: Array<{ path: string; count: number; avgDurationMs: number; errorCount: number }>;
  statusDistribution: Array<{ statusCode: number; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  methodDistribution: Array<{ method: string; count: number }>;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ── Helper Components ───────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const color = status < 300
    ? "text-emerald-600 dark:text-emerald-400"
    : status < 400
      ? "text-blue-600 dark:text-blue-400"
      : status < 500
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";

  return <span className={cn("font-mono font-semibold", color)}>{status}</span>;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  alert,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "rounded-full p-3",
            alert ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              alert ? "text-destructive" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const formatHour = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Component ───────────────────────────────────────────────────

export function OverviewTab({
  stats,
  statsLoading,
}: {
  stats: StatsData | null;
  statsLoading: boolean;
}) {
  return (
    <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Requests"
                value={stats.summary.totalRequests.toLocaleString("de-DE")}
                subtitle={`P95: ${stats.summary.p95DurationMs}ms`}
                icon={Activity}
              />
              <StatCard
                title="Fehlerrate"
                value={`${stats.summary.errorRate}%`}
                subtitle={`${stats.summary.errorCount} Fehler`}
                icon={AlertTriangle}
                alert={stats.summary.errorRate > 5}
              />
              <StatCard
                title="Ø Antwortzeit"
                value={`${stats.summary.avgDurationMs}ms`}
                icon={Clock}
                alert={stats.summary.avgDurationMs > 2000}
              />
              <StatCard
                title="Aktive Nutzer"
                value={stats.summary.uniqueUsers}
                icon={Users}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">Keine Daten verfügbar.</p>
          )}

          {/* Charts */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests per hour */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Requests pro Stunde</CardTitle>
                  <CardDescription>Anfragen und Fehler im Zeitverlauf</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.requestsByHour.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.requestsByHour}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={formatHour}
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(label) => formatHour(String(label))}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Requests"
                          stroke={CHART_COLORS[0]}
                          fill={CHART_COLORS[0]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="errors"
                          name="Fehler"
                          stroke={CHART_COLORS[2]}
                          fill={CHART_COLORS[2]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-12 text-center">
                      Keine Daten im Zeitraum.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Endpoints</CardTitle>
                  <CardDescription>Die 10 meistgenutzten Endpunkte</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.topEndpoints.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={stats.topEndpoints.slice(0, 10)}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="path"
                          width={80}
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + "..." : v}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar dataKey="count" name="Anfragen" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-12 text-center">
                      Keine Daten im Zeitraum.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">HTTP-Methoden</CardTitle>
                  <CardDescription>Verteilung der Anfragemethoden</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.methodDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.methodDistribution}
                          dataKey="count"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(props: PieLabelRenderProps) =>
                            `${props.name ?? ""}: ${props.value}`
                          }
                        >
                          {stats.methodDistribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-12 text-center">
                      Keine Daten im Zeitraum.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Codes</CardTitle>
                  <CardDescription>Verteilung der HTTP-Statuscodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.statusDistribution.map((s) => {
                      const pct = stats.summary.totalRequests > 0
                        ? Math.round((s.count / stats.summary.totalRequests) * 100)
                        : 0;
                      return (
                        <div key={s.statusCode} className="flex items-center gap-3">
                          <StatusBadge status={s.statusCode} />
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                s.statusCode < 300 ? "bg-emerald-500" :
                                s.statusCode < 400 ? "bg-blue-500" :
                                s.statusCode < 500 ? "bg-amber-500" : "bg-destructive"
                              )}
                              style={{ width: `${Math.max(pct, 1)}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {s.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                    {stats.statusDistribution.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Keine Daten im Zeitraum.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
  );
}
