import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";

const SCRIPT = "bash scripts/security-check.sh";
const ROOT = process.cwd();

/**
 * Helper: run the security check script with given flags.
 * Returns { stdout, exitCode }.
 */
function runCheck(flags = ""): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`${SCRIPT} ${flags}`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30_000,
      env: { ...process.env, PATH: process.env.PATH },
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: e.stdout || "", exitCode: e.status || 1 };
  }
}

describe("Security Check Script", () => {
  // =========================================================
  // CLI flags
  // =========================================================
  describe("CLI flags", () => {
    it("--list prints all available checks", () => {
      const { stdout, exitCode } = runCheck("--list");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A01");
      expect(stdout).toContain("A02");
      expect(stdout).toContain("A03");
      expect(stdout).toContain("A04");
      expect(stdout).toContain("A05");
      expect(stdout).toContain("A06");
      expect(stdout).toContain("A07");
      expect(stdout).toContain("A08");
      expect(stdout).toContain("A09");
      expect(stdout).toContain("A10");
      expect(stdout).toContain("PII");
    });

    it("--help prints usage info", () => {
      const { stdout, exitCode } = runCheck("--help");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Usage:");
      expect(stdout).toContain("--only");
      expect(stdout).toContain("--strict");
    });

    it("--only A08 runs only A08 check", () => {
      const { stdout, exitCode } = runCheck("--only A08 --no-audit");
      expect(exitCode).toBe(0);
      // A08 checks should be present
      expect(stdout).toContain("A08");
      expect(stdout).toContain("Lockfile");
      // Other checks should NOT be present
      expect(stdout).not.toContain("A01");
      expect(stdout).not.toContain("A03");
      expect(stdout).not.toContain("PII");
    });

    it("--json outputs valid JSON", () => {
      const { stdout, exitCode } = runCheck("--json --no-audit");
      expect(exitCode).toBe(0);
      const json = JSON.parse(stdout);
      expect(json).toHaveProperty("status");
      expect(json).toHaveProperty("errors");
      expect(json).toHaveProperty("warnings");
      expect(json).toHaveProperty("results");
      expect(Array.isArray(json.results)).toBe(true);
      expect(json.errors).toBeTypeOf("number");
      expect(json.warnings).toBeTypeOf("number");
    });

    it("--no-audit skips npm audit", () => {
      const { stdout, exitCode } = runCheck("--only A06 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("übersprungen");
    });
  });

  // =========================================================
  // Individual check categories
  // =========================================================
  describe("OWASP checks", () => {
    it("A01 – detects access control", () => {
      const { stdout, exitCode } = runCheck("--only A01 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A01");
    });

    it("A02 – detects cryptographic issues", () => {
      const { stdout, exitCode } = runCheck("--only A02 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A02");
    });

    it("A03 – detects injection risks", () => {
      const { stdout, exitCode } = runCheck("--only A03 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A03");
    });

    it("A04 – detects insecure design (debug routes)", () => {
      const { stdout, exitCode } = runCheck("--only A04 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A04");
    });

    it("A05 – detects security misconfiguration", () => {
      const { stdout, exitCode } = runCheck("--only A05 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A05");
    });

    it("A07 – detects auth failures", () => {
      const { stdout, exitCode } = runCheck("--only A07 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A07");
    });

    it("A08 – detects integrity issues", () => {
      const { stdout, exitCode } = runCheck("--only A08 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Lockfile");
    });

    it("A09 – detects logging issues", () => {
      const { stdout, exitCode } = runCheck("--only A09 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A09");
    });

    it("A10 – detects SSRF risks", () => {
      const { stdout, exitCode } = runCheck("--only A10 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("A10");
    });

    it("PII – detects privacy leaks", () => {
      const { stdout, exitCode } = runCheck("--only PII --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Datenschutz");
    });
  });

  // =========================================================
  // --strict mode
  // =========================================================
  describe("strict mode", () => {
    it("--strict converts warnings to errors and fails if any exist", () => {
      const { stdout, exitCode } = runCheck("--strict --no-audit");
      // Our codebase has known warnings (PII logs, debug routes, etc.)
      // In strict mode these become errors => exit 1
      expect(exitCode).toBe(1);
      expect(stdout).toContain("fehlgeschlagen");
    });

    it("--strict --only A08 passes when check has no warnings", () => {
      // A08 has no warnings in our codebase (lockfile exists, prepare script exists)
      const { stdout, exitCode } = runCheck("--strict --only A08 --no-audit");
      expect(exitCode).toBe(0);
      expect(stdout).toContain("bestanden");
    });
  });

  // =========================================================
  // Full run passes (pre-commit behavior)
  // =========================================================
  describe("full run", () => {
    it("full check passes (exit 0) without --strict", () => {
      const { exitCode } = runCheck("--no-audit");
      expect(exitCode).toBe(0);
    });

    it("generates security-report.md", () => {
      runCheck("--no-audit");
      const reportPath = join(ROOT, "security-report.md");
      expect(existsSync(reportPath)).toBe(true);
    });
  });
});
