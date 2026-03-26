"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { CheckCircle, XCircle, TrendingUp, Shield, TestTube, Database, Code, FileCode, Layers, Gauge, BookOpen, Server, Package } from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";
import { useState } from "react";

// --- Types ---

interface CategoryScore {
  category: string;
  score: number;
  previous: number;
  evaluator: number;
}

interface Finding {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: "resolved" | "open";
  version?: string;
}

interface FindingSummary {
  total: number;
  resolved: number;
  open: number;
  byPriority: Record<string, { total: number; resolved: number }>;
  byCategory: Record<string, { total: number; resolved: number }>;
}

export interface QualityData {
  overallScore: number;
  previousScore: number;
  evaluatorScore: number;
  version: string;
  categoryScores: CategoryScore[];
  tests: { total: number; files: number; allPassing: boolean; apiRouteTests: number };
  codeQuality: {
    typescriptErrors: number; eslintErrors: number; eslintWarnings: number;
    npmAuditVulnerabilities: number; dbIndices: number; errorBoundaries: number;
    loadingStates: number; serverComponentPages: number; fetchWaterfallPages: number;
  };
  coverage: { statements: number; branches: number; functions: number; lines: number } | null;
  findings: FindingSummary;
  findingDetails: Finding[];
  evaluatorFindings: { total: number; resolved: number; partial: number; open: number } | null;
  scoreHistory: Array<{ date: string; score: number }>;
  techStack: Array<{ name: string; version: string; category: string; logo: string; url: string; license: string }>;
}

// --- Sub-Components ---

function ScoreCircle({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const color = score >= 9 ? "text-green-500" : score >= 7 ? "text-yellow-500" : "text-red-500";
  const bgColor = score >= 9 ? "bg-green-500/10" : score >= 7 ? "bg-yellow-500/10" : "bg-red-500/10";
  const sz = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const textSz = size === "lg" ? "text-3xl" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sz} rounded-full ${bgColor} flex items-center justify-center`}>
        <span className={`${textSz} font-bold ${color}`}>{score.toFixed(1)}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Security: Shield, Architecture: Layers, Performance: Gauge, Testing: TestTube,
  "API Design": Code, Database: Database, Konzept: BookOpen,
  "Best Practices": FileCode, Scaling: Server, "BOM/Dependencies": Package,
};

function FindingRow({ finding }: { finding: Finding }) {
  const prioColors: Record<string, string> = {
    P0: "bg-red-500 text-white", P1: "bg-orange-500 text-white",
    P2: "bg-yellow-500 text-black", P3: "bg-blue-500 text-white",
  };

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${finding.status === "resolved" ? "opacity-60" : ""}`}>
      {finding.status === "resolved"
        ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
      <Badge className={`${prioColors[finding.priority] || "bg-gray-500 text-white"} text-[10px] px-1.5 py-0 shrink-0`}>
        {finding.priority}
      </Badge>
      <span className={`text-sm flex-1 ${finding.status === "resolved" ? "line-through" : ""}`}>
        {finding.id}: {finding.title}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">
        {finding.status === "resolved" ? finding.version : finding.category}
      </span>
    </div>
  );
}

// --- Main Component ---

export function QualityTab({ data, loading }: { data: QualityData | null; loading: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  if (loading) {
    return (
      <TabsContent value="quality" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-4 pb-3"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><div className="h-64 bg-muted animate-pulse rounded" /></CardContent></Card>
      </TabsContent>
    );
  }

  if (!data) {
    return (
      <TabsContent value="quality" className="space-y-4">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Keine Qualitaetsdaten verfuegbar</CardContent></Card>
      </TabsContent>
    );
  }

  const radarData = data.categoryScores.map((c) => ({
    category: c.category.length > 12 ? c.category.substring(0, 10) + ".." : c.category,
    score: c.score,
    fullMark: 10,
  }));

  const findingsByPrioData = Object.entries(data.findings.byPriority).map(([prio, counts]) => ({
    priority: prio,
    resolved: counts.resolved,
    open: counts.total - counts.resolved,
  }));

  const filteredFindings = selectedCategory
    ? data.findingDetails.filter((f) => f.category === selectedCategory)
    : data.findingDetails;

  const displayFindings = showResolved
    ? filteredFindings
    : filteredFindings.filter((f) => f.status === "open");

  const delta = data.overallScore - data.previousScore;

  return (
    <TabsContent value="quality" className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 flex flex-col items-center justify-center">
            <ScoreCircle score={data.overallScore} label="Deep-Dive Score" />
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500 font-medium">+{delta.toFixed(1)} seit Review</span>
            </div>
          </CardContent>
        </Card>
        <StatCard icon={TestTube} label="Tests" value={data.tests.total} sub={`${data.tests.files} Dateien, ${data.tests.apiRouteTests} API-Route-Tests`} />
        <StatCard icon={CheckCircle} label="Findings behoben" value={`${data.findings.resolved}/${data.findings.total}`} sub={`${data.findings.open} offen`} />
        <StatCard icon={Shield} label="npm audit" value={data.codeQuality.npmAuditVulnerabilities === 0 ? "Clean" : data.codeQuality.npmAuditVulnerabilities.toString()} sub="0 Vulnerabilities" />
        <StatCard icon={Database} label="DB Indices" value={data.codeQuality.dbIndices} sub={`${data.codeQuality.serverComponentPages} Server Pages`} />
      </div>

      {/* Radar Chart + Category Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategorie-Bewertung</CardTitle>
            <CardDescription>Deep-Dive Score pro Kategorie (0-10)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategorie-Details</CardTitle>
            <CardDescription>Klicken fuer Findings pro Kategorie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.categoryScores.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.category] || Code;
              const catFindings = data.findings.byCategory[cat.category];
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{cat.category}</span>
                  <span className={`text-sm font-bold ${cat.score >= 9 ? "text-green-500" : cat.score >= 7 ? "text-yellow-500" : "text-red-500"}`}>
                    {cat.score.toFixed(1)}
                  </span>
                  {cat.score > cat.previous && (
                    <span className="text-xs text-green-500">+{(cat.score - cat.previous).toFixed(1)}</span>
                  )}
                  {catFindings && (
                    <Badge variant="outline" className="text-[10px]">
                      {catFindings.resolved}/{catFindings.total}
                    </Badge>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Findings by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Findings nach Prioritaet</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={findingsByPrioData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="priority" type="category" width={30} />
                <Tooltip />
                <Bar dataKey="resolved" name="Behoben" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="open" name="Offen" stackId="a" fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {data.scoreHistory.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score-Verlauf (Evaluator)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.split("_")[1] || d.substring(11, 16)} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Code Quality Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code-Qualitaet</CardTitle>
          <CardDescription>TypeScript, ESLint, Coverage, Architektur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <QualityBadge label="TypeScript" value={data.codeQuality.typescriptErrors} good={0} unit=" Errors" />
            <QualityBadge label="ESLint" value={data.codeQuality.eslintErrors + data.codeQuality.eslintWarnings} good={0} unit=" Issues" />
            <QualityBadge label="npm audit" value={data.codeQuality.npmAuditVulnerabilities} good={0} unit=" Vulns" />
            <QualityBadge label="Error Boundaries" value={data.codeQuality.errorBoundaries} good={8} unit="" inverse />
            <QualityBadge label="Loading States" value={data.codeQuality.loadingStates} good={10} unit="/41" inverse />
            <QualityBadge label="Fetch Waterfall" value={data.codeQuality.fetchWaterfallPages} good={0} unit=" Pages" />
          </div>
          {data.coverage && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CoverageBar label="Statements" value={data.coverage.statements} />
              <CoverageBar label="Branches" value={data.coverage.branches} />
              <CoverageBar label="Functions" value={data.coverage.functions} />
              <CoverageBar label="Lines" value={data.coverage.lines} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tech Stack / BOM */}
      {data.techStack && data.techStack.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tech-Stack / Bill of Materials
            </CardTitle>
            <CardDescription>
              {data.techStack.length} Kern-Technologien — alle Lizenzen auf Greenlist (MIT, Apache-2.0, ISC)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.techStack.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tech.logo}
                    alt={tech.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{tech.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{tech.version}</span>
                      <span className="text-[10px] text-muted-foreground/50">|</span>
                      <span className="text-[10px] text-muted-foreground">{tech.category}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 hidden sm:inline-flex">
                    {tech.license}
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finding Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedCategory ? `Findings: ${selectedCategory}` : "Alle Findings"}
              </CardTitle>
              <CardDescription>
                {displayFindings.length} {showResolved ? "gesamt" : "offen"} angezeigt
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className="ml-2 text-primary hover:underline">
                    Alle zeigen
                  </button>
                )}
              </CardDescription>
            </div>
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1"
            >
              {showResolved ? "Nur offene" : "Alle anzeigen"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {displayFindings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>{selectedCategory ? `Keine offenen Findings in ${selectedCategory}` : "Keine offenen Findings"}</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {displayFindings.map((f) => <FindingRow key={f.id} finding={f} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// --- Helper Components ---

function QualityBadge({ label, value, good, unit, inverse }: { label: string; value: number; good: number; unit: string; inverse?: boolean }) {
  const isGood = inverse ? value >= good : value <= good;
  return (
    <div className={`p-3 rounded-lg text-center ${isGood ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
      <p className={`text-lg font-bold ${isGood ? "text-green-600" : "text-yellow-600"}`}>{value}{unit}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CoverageBar({ label, value }: { label: string; value: number }) {
  const color = value >= 60 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
