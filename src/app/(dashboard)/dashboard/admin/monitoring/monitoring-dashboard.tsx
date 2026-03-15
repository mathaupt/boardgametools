"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  UserX,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface StatsData {
  summary: StatsSummary;
  requestsByHour: Array<{ hour: string; count: number; errors: number }>;
  topEndpoints: Array<{ path: string; count: number; avgDurationMs: number; errorCount: number }>;
  statusDistribution: Array<{ statusCode: number; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  methodDistribution: Array<{ method: string; count: number }>;
}

interface LogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  userAgent: string | null;
  ip: string | null;
  errorMessage: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Anomaly {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  details: Record<string, unknown>;
  detectedAt: string;
}

interface AnomaliesData {
  anomalies: Anomaly[];
  healthScore: number;
  checkedAt: string;
}

type Period = "1h" | "6h" | "24h" | "7d" | "30d";

const PERIODS: { value: Period; label: string }[] = [
  { value: "1h", label: "1 Stunde" },
  { value: "6h", label: "6 Stunden" },
  { value: "24h", label: "24 Stunden" },
  { value: "7d", label: "7 Tage" },
  { value: "30d", label: "30 Tage" },
];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ── Helper Components ───────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const variant = {
    GET: "default" as const,
    POST: "secondary" as const,
    PUT: "outline" as const,
    PATCH: "outline" as const,
    DELETE: "destructive" as const,
  }[method] ?? "default" as const;

  return <Badge variant={variant} className="font-mono text-xs">{method}</Badge>;
}

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

// ── Main Component ──────────────────────────────────────────────

export function MonitoringDashboard() {
  const [period, setPeriod] = useState<Period>("24h");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Logs
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logMethod, setLogMethod] = useState<string>("ALL");
  const [logPath, setLogPath] = useState("");
  const [logStatus, setLogStatus] = useState<string>("ALL");

  // Anomalies
  const [anomalies, setAnomalies] = useState<AnomaliesData | null>(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);

  // Purge dialog
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState("30");
  const [purging, setPurging] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/monitoring/stats?period=${period}`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setStatsLoading(false);
  }, [period]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: logPage.toString(),
        limit: "30",
      });
      if (logMethod !== "ALL") params.set("method", logMethod);
      if (logPath) params.set("path", logPath);
      if (logStatus === "2xx") params.set("statusCode", "200");
      if (logStatus === "4xx") params.set("statusCode", "400");
      if (logStatus === "5xx") params.set("statusCode", "500");

      const res = await fetch(`/api/admin/monitoring/logs?${params}`);
      if (res.ok) setLogs(await res.json());
    } catch { /* ignore */ }
    setLogsLoading(false);
  }, [logPage, logMethod, logPath, logStatus]);

  const fetchAnomalies = useCallback(async () => {
    setAnomaliesLoading(true);
    try {
      const anomalyPeriod = period === "30d" ? "7d" : period;
      const res = await fetch(`/api/admin/monitoring/anomalies?period=${anomalyPeriod}`);
      if (res.ok) setAnomalies(await res.json());
    } catch { /* ignore */ }
    setAnomaliesLoading(false);
  }, [period]);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchLogs();
    fetchAnomalies();
  }, [fetchStats, fetchLogs, fetchAnomalies]);

  // Initial fetch & period change
  useEffect(() => {
    fetchStats();
    fetchAnomalies();
  }, [fetchStats, fetchAnomalies]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refreshAll, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshAll]);

  const handlePurge = async () => {
    setPurging(true);
    try {
      const res = await fetch("/api/admin/monitoring/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: parseInt(purgeDays, 10) }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.deleted} Logs gelöscht.`);
        setPurgeOpen(false);
        refreshAll();
      }
    } catch { /* ignore */ }
    setPurging(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHour = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Aktualisieren
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
            Auto-Refresh (30s)
          </Label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalien
            {anomalies && anomalies.anomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {anomalies.anomalies.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: Übersicht ─── */}
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

        {/* ─── Tab: Logs ─── */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Select value={logMethod} onValueChange={(v) => { setLogMethod(v); setLogPage(1); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Methode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Alle</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Pfad suchen..."
                  value={logPath}
                  onChange={(e) => { setLogPath(e.target.value); setLogPage(1); }}
                  className="w-[200px]"
                />

                <Select value={logStatus} onValueChange={(v) => { setLogStatus(v); setLogPage(1); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Alle</SelectItem>
                    <SelectItem value="2xx">2xx</SelectItem>
                    <SelectItem value="4xx">4xx</SelectItem>
                    <SelectItem value="5xx">5xx</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Trash2 className="h-4 w-4 mr-2" /> Alte Logs löschen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alte Logs löschen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Logs älter als (Tage)</Label>
                        <Input
                          type="number"
                          min={7}
                          value={purgeDays}
                          onChange={(e) => setPurgeDays(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Minimum: 7 Tage</p>
                      </div>
                      <Button
                        onClick={handlePurge}
                        disabled={purging || parseInt(purgeDays) < 7}
                        variant="destructive"
                        className="w-full"
                      >
                        {purging ? "Wird gelöscht..." : "Logs endgültig löschen"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardContent className="pt-6">
              {logsLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : logs && logs.logs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zeitpunkt</TableHead>
                          <TableHead>Methode</TableHead>
                          <TableHead>Pfad</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Dauer</TableHead>
                          <TableHead>Nutzer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(log.createdAt)}
                            </TableCell>
                            <TableCell><MethodBadge method={log.method} /></TableCell>
                            <TableCell className="font-mono text-xs max-w-[250px] truncate">
                              {log.path}
                            </TableCell>
                            <TableCell><StatusBadge status={log.statusCode} /></TableCell>
                            <TableCell className={cn(
                              "text-right font-mono text-xs",
                              log.durationMs > 2000 && "text-destructive font-semibold"
                            )}>
                              {log.durationMs}ms
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.user?.name ?? <span className="text-muted-foreground">Anonym</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator className="my-4" />

                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {logs.total} Einträge, Seite {logs.page} von {logs.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logs.page <= 1}
                        onClick={() => setLogPage((p) => p - 1)}
                      >
                        Zurück
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logs.page >= logs.totalPages}
                        onClick={() => setLogPage((p) => p + 1)}
                      >
                        Weiter
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine Logs gefunden.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Anomalien ─── */}
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
                  <div className="flex items-center gap-6">
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
      </Tabs>
    </div>
  );
}
