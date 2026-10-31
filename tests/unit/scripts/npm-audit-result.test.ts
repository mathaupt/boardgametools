import { describe, expect, it } from "vitest";
import { readAuditSummary } from "../../../scripts/lib/npm-audit-result.mjs";

describe("readAuditSummary", () => {
  it("rejects npm registry error payloads instead of treating them as clean", () => {
    expect(readAuditSummary(JSON.stringify({ error: { code: "ENETWORK" } }))).toBeNull();
  });

  it("rejects missing or malformed vulnerability metadata", () => {
    expect(readAuditSummary(JSON.stringify({ auditReportVersion: 2 }))).toBeNull();
    expect(readAuditSummary("not-json")).toBeNull();
  });

  it("accepts a valid zero-vulnerability audit", () => {
    expect(readAuditSummary(JSON.stringify({
      auditReportVersion: 2,
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
    }))).toEqual({ info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 });
  });

  it("accepts nonzero findings when audit metadata is complete", () => {
    expect(readAuditSummary(JSON.stringify({
      auditReportVersion: 2,
      metadata: { vulnerabilities: { info: 0, low: 2, moderate: 23, high: 1, critical: 0, total: 26 } },
    }))).toEqual({ info: 0, low: 2, moderate: 23, high: 1, critical: 0, total: 26 });
  });
});
