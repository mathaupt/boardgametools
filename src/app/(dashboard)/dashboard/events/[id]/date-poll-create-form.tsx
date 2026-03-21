"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Loader2 } from "lucide-react";
import { WEEKDAY_LABELS } from "./date-poll-types";

export function DateCreateForm({
  startDate,
  endDate,
  selectedWeekdays,
  loading,
  onStartDateChange,
  onEndDateChange,
  onToggleWeekday,
  onSubmit,
}: {
  startDate: string;
  endDate: string;
  selectedWeekdays: number[];
  loading: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onToggleWeekday: (day: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
      <h4 className="font-medium">Zeitraum & Wochentage wählen</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Von</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endDate">Bis</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Nur bestimmte Wochentage (optional)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {WEEKDAY_LABELS.map((day) => (
            <label
              key={day.value}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                checked={selectedWeekdays.includes(day.value)}
                onChange={() => onToggleWeekday(day.value)}
              />
              <span className="text-sm">{day.label}</span>
            </label>
          ))}
        </div>
        {selectedWeekdays.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Keine Auswahl = alle Tage
          </p>
        )}
      </div>

      <Button
        onClick={onSubmit}
        disabled={loading || !startDate || !endDate}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4 mr-2" />
        )}
        Termine erstellen
      </Button>
    </div>
  );
}
