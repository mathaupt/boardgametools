"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface GroupStatisticsChartsProps {
  monthlyActivity: Array<{
    month: string;
    comments: number;
  }>;
}

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

export function GroupStatisticsCharts({
  monthlyActivity,
}: GroupStatisticsChartsProps) {
  const monthlyData = monthlyActivity.map((m) => ({
    ...m,
    label: formatMonthLabel(m.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Monatliche Aktivität
        </CardTitle>
        <CardDescription>Kommentare der letzten 12 Monate</CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyData.length === 0 || monthlyData.every((m) => m.comments === 0) ? (
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
                formatter={(value) => [`${value}`, "Kommentare"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar
                dataKey="comments"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
