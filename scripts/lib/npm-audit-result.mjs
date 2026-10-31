const severities = ["info", "low", "moderate", "high", "critical", "total"];

/** Return validated npm audit vulnerability counts, or null for any failed/incomplete response. */
export function readAuditSummary(output) {
  try {
    const audit = JSON.parse(output);
    if (audit?.auditReportVersion !== 2 || audit.error) return null;
    const counts = audit.metadata?.vulnerabilities;
    if (!counts || severities.some((key) => !Number.isSafeInteger(counts[key]) || counts[key] < 0)) return null;
    const severityTotal = counts.info + counts.low + counts.moderate + counts.high + counts.critical;
    if (counts.total !== severityTotal) return null;
    return Object.fromEntries(severities.map((key) => [key, counts[key]]));
  } catch {
    return null;
  }
}
