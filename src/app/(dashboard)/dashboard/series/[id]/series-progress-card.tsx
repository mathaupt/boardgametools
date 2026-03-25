import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Library } from "lucide-react";
import type { SeriesEntry } from "./types";

interface SeriesProgressCardProps {
  entries: SeriesEntry[];
}

export function SeriesProgressCard({ entries }: SeriesProgressCardProps) {
  const total = entries.length;
  const played = entries.filter((e) => e.played).length;
  const progress = total > 0 ? Math.round((played / total) * 100) : 0;
  const isComplete = total > 0 && played === total;

  return (
    <Card className={isComplete ? "border-success bg-success/10" : ""}>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Library className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">
              {isComplete ? "Alle Spiele durchgespielt!" : `${played} von ${total} gespielt`}
            </span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`rounded-full h-3 transition-all duration-500 ${
              isComplete ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
