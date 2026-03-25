"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// ── Types ───────────────────────────────────────────────────────

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

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Component ───────────────────────────────────────────────────

export function LogsTab({
  period,
  onRefreshAll,
}: {
  period: string;
  onRefreshAll: () => void;
}) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logMethod, setLogMethod] = useState<string>("ALL");
  const [logPath, setLogPath] = useState("");
  const [logStatus, setLogStatus] = useState<string>("ALL");

  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState("30");
  const [purging, setPurging] = useState(false);

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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
        toast({ title: "Logs gelöscht", description: `${data.deleted} Logs wurden erfolgreich gelöscht.` });
        setPurgeOpen(false);
        onRefreshAll();
        fetchLogs();
      }
    } catch { /* ignore */ }
    setPurging(false);
  };

  return (
    <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Select value={logMethod} onValueChange={(v) => { setLogMethod(v); setLogPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[120px]">
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
                  className="w-full sm:w-[200px]"
                />

                <Select value={logStatus} onValueChange={(v) => { setLogStatus(v); setLogPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[120px]">
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
  );
}
