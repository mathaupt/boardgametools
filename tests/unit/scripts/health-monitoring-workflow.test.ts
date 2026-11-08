// @vitest-environment node
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, it, expect } from "vitest";
describe("health monitoring workflow", () => {
  it("runs independent bounded probes with minimal permissions and a protected secret", () => {
    const workflow = parse(readFileSync(".github/workflows/health-monitoring.yml", "utf8"));
    expect(workflow.on).toHaveProperty("workflow_dispatch");
    expect(workflow.on.schedule).toEqual([{ cron: "7,22,37,52 * * * *" }]);
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
    for (const [name, flag] of [["liveness", "health"], ["readiness", "health-readiness"]]) {
      const job = workflow.jobs[name];
      expect(job.needs).toBeUndefined();
      expect(job["timeout-minutes"]).toBe(2);
      expect(job.steps.some((step: { run?: string }) => step.run === `bash scripts/check-pipeline.sh --${flag}`)).toBe(true);
      expect(JSON.stringify(job)).not.toMatch(/npm ci|SQL_DATABASE_URL|continue-on-error/);
    }
    const step = workflow.jobs.readiness.steps.find((step: { run?: string }) => step.run);
    expect(step.env.HEALTH_READINESS_TOKEN).toBe("${{ secrets.HEALTH_READINESS_TOKEN }}");
    expect(JSON.stringify(workflow.jobs.liveness)).not.toContain("secrets.");
  });
});
