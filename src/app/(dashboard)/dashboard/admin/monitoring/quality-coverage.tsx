import { formatShortDateTime } from "@/lib/date";

export interface CoverageValues { statements: number; branches: number; functions: number; lines: number }
export interface QualityCoverageProps {
  coverage: CoverageValues | null;
  libraryCoverage: CoverageValues | null;
  coverageMeasuredAt: string | null;
  coverageVersion: string | null;
}
const labels = { statements: "Anweisungen", branches: "Zweige", functions: "Funktionen", lines: "Zeilen" };

function CoverageGroup({ title, values }: { title: string; values: CoverageValues }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(labels) as Array<keyof CoverageValues>).map(key => (
          <div key={key} className="min-w-0">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{labels[key]}</span>
              <span className="font-medium tabular-nums">{values[key].toLocaleString("de-DE", {minimumFractionDigits:1,maximumFractionDigits:1})} %</span>
            </div>
            <div role="progressbar" aria-label={`${labels[key]} – ${title}`} aria-valuenow={values[key]} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${values[key]>=80 ? "bg-success" : "bg-warning"}`} style={{width:`${values[key]}%`}} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function QualityCoverage({ coverage, libraryCoverage, coverageMeasuredAt, coverageVersion }: QualityCoverageProps) {
  if (!coverage || !coverageMeasuredAt || !coverageVersion) {
    return <p className="mt-4 text-sm text-muted-foreground">Keine vollständige Coverage-Messung verfügbar. Bitte einen vollständigen Testlauf mit Coverage veröffentlichen.</p>;
  }
  return (
    <div className="mt-5 space-y-5 border-t border-border pt-5">
      <div className="space-y-2">
        <h3 className="font-semibold">Testabdeckung</h3>
        <p className="text-sm text-muted-foreground">Messstand: <time dateTime={coverageMeasuredAt}>{formatShortDateTime(coverageMeasuredAt)}</time> · Version {coverageVersion}</p>
        <p className="text-sm text-muted-foreground">Das Ziel von 80 % gilt für jede Kennzahl. Der erreichte Bibliothekswert ist von der gesamten Abdeckung getrennt.</p>
      </div>
      <CoverageGroup title="Gesamter Messumfang" values={coverage} />
      <p className="text-sm text-muted-foreground">Bibliotheken, API-Routen sowie die in der Coverage-Konfiguration erfassten Komponenten und Ansichten; ohne generierte UI-Bausteine und reine Datendateien.</p>
      {libraryCoverage && <CoverageGroup title="Bibliotheken (src/lib)" values={libraryCoverage} />}
    </div>
  );
}
