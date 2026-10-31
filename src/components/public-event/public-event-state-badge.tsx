import { Badge } from "@/components/ui/badge";

export function PublicEventStateBadge({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="bg-warning/20 py-1 text-warning-foreground">
      {label}
    </Badge>
  );
}
