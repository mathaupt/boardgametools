"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface StatisticsChartsProps {
  monthlyActivity: Array<{
    month: string;
    sessions: number;
    totalMinutes: number;
  }>;
  playerStats: Array<{
    userId: string;
    userName: string;
    totalSessions: number;
    wins: number;
    winRate: number;
  }>;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const monthNames = [
    "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
  ];
  return `${monthNames[parseInt(m, 10) - 1]} ${year.slice(2)}`;
}

export function StatisticsCharts({
  monthlyActivity,
  playerStats,
}: StatisticsChartsProps) {
  const monthlyData = monthlyActivity.map((m) => ({
    ...m,
    label: formatMonthLabel(m.month),
  }));

  const topPlayers = playerStats
    .filter((p) => p.wins > 0)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Monatliche Aktivität
          </CardTitle>
          <CardDescription>Sessions der letzten 12 Monate</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.every((m) => m.sessions === 0) ? (
            <p className="text-sm text-muted-foreground">Keine Daten.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}`, "Sessions"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar
                  dataKey="sessions"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Players by Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Top-Spieler nach Siegen
          </CardTitle>
          <CardDescription>
            Anzahl der Siege pro Spieler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Siege erfasst.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPlayers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="userName"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}`, "Siege"]}
                />
                <Bar
                  dataKey="wins"
                  fill={CHART_COLORS[1]}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
