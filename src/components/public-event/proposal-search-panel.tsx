import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProposalSearchPanelProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}

export function ProposalSearchPanel({ id, title, description, icon: Icon, children }: ProposalSearchPanelProps) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <Card className="min-w-0 border-border bg-card text-card-foreground shadow-none">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle id={id} as="h2" className="flex items-start gap-2 text-lg leading-snug">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
      </Card>
    </section>
  );
}

export function ProposalResultList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="max-h-80 min-w-0 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-background text-foreground">
      {children}
    </ul>
  );
}

export function ProposalResultRow({ children }: { children: ReactNode }) {
  return <li className="flex min-w-0 flex-wrap items-center gap-3 px-3 py-3">{children}</li>;
}
