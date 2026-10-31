export type AuditSummary = {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
  total: number;
};

export function readAuditSummary(output: string): AuditSummary | null;
