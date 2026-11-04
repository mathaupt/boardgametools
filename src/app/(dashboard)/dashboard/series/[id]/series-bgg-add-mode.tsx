interface SeriesBggAddModeProps {
  value: "collection" | "temporary";
  reason: "" | "BORROWED" | "BROUGHT_BY_SOMEONE" | "NO_LONGER_OWNED" | "OTHER";
  disabled?: boolean;
  onChange: (value: "collection" | "temporary") => void;
  onReasonChange: (value: SeriesBggAddModeProps["reason"]) => void;
}

export function SeriesBggAddMode({ value, reason, disabled = false, onChange, onReasonChange }: SeriesBggAddModeProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">In die Reihe aufnehmen als</legend>
      <div className="grid grid-cols-1 gap-2 min-[24rem]:grid-cols-2" role="radiogroup" aria-label="Art des Reiheneintrags">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
          <input type="radio" name="series-bgg-add-mode" value="collection" checked={value === "collection"} disabled={disabled} onChange={() => onChange("collection")} className="accent-primary" />
          <span className="text-sm font-medium">Auch in meine Sammlung</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
          <input type="radio" name="series-bgg-add-mode" value="temporary" checked={value === "temporary"} disabled={disabled} onChange={() => onChange("temporary")} className="accent-primary" />
          <span className="text-sm font-medium">Nur in diese Reihe</span>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        {disabled
          ? "Entferne zuerst die ausgewählten Spiele, um die Aufnahmeart zu wechseln."
          : value === "temporary"
            ? "Das Spiel bleibt außerhalb deiner Sammlung und wird nur in dieser Reihe geführt."
            : "Ein neues BGG-Spiel wird in deine Sammlung importiert; vorhandene Sammlungsspiele werden direkt verknüpft."}
      </p>
      {value === "temporary" && (
        <label className="block space-y-1 text-sm font-medium">
          <span>Herkunft (optional)</span>
          <select
            aria-label="Optionale Herkunft"
            value={reason}
            disabled={disabled}
            onChange={(event) => onReasonChange(event.target.value as SeriesBggAddModeProps["reason"])}
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Keine Angabe</option>
            <option value="BORROWED">Ausgeliehen</option>
            <option value="BROUGHT_BY_SOMEONE">Von jemandem mitgebracht</option>
            <option value="NO_LONGER_OWNED">Nicht mehr im Besitz</option>
            <option value="OTHER">Sonstiges</option>
          </select>
        </label>
      )}
    </fieldset>
  );
}
