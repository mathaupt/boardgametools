"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import dynamic from "next/dynamic";
import type { StatsData } from "./overview-tab";

const OverviewTab = dynamic(
  () => import("./overview-tab").then((mod) => mod.OverviewTab),
  { ssr: false }
);
import { LogsTab } from "./logs-tab";
import { AnomaliesTab, type AnomaliesData } from "./anomalies-tab";

// ── Types ───────────────────────────────────────────────────────

type Period = "1h" | "6h" | "24h" | "7d" | "30d";

const PERIODS: { value: Period; label: string }[] = [
  { value: "1h", label: "1 Stunde" },
  { value: "6h", label: "6 Stunden" },
  { value: "24h", label: "24 Stunden" },
  { value: "7d", label: "7 Tage" },
  { value: "30d", label: "30 Tage" },
];

// ── Main Component ──────────────────────────────────────────────

export function MonitoringDashboard() {
  const [period, setPeriod] = useState<Period>("24h");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Anomalies
  const [anomalies, setAnomalies] = useState<AnomaliesData | null>(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/monitoring/stats?period=${period}`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setStatsLoading(false);
  }, [period]);

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
    fetchAnomalies();
  }, [fetchStats, fetchAnomalies]);

  // Initial fetch & period change
  useEffect(() => {
    fetchStats();
    fetchAnomalies();
  }, [fetchStats, fetchAnomalies]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refreshAll, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshAll]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-full sm:w-[160px]">
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

        <OverviewTab stats={stats} statsLoading={statsLoading} />
        <LogsTab period={period} onRefreshAll={refreshAll} />
        <AnomaliesTab anomalies={anomalies} anomaliesLoading={anomaliesLoading} />
      </Tabs>
    </div>
  );
}
