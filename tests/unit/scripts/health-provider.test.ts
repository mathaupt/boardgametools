// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDirs: string[] = [];
const token = "test-readiness-token-0123456789abcdef";

function runProvider(name: "health" | "health-readiness", status: string, body: string, curlExit = "0", includeToken = true) {
  const dir = mkdtempSync(path.join(tmpdir(), "bgt-health-provider-"));
  tempDirs.push(dir);
  const curlPath = path.join(dir, "curl");
  const argsPath = path.join(dir, "args");
  const stdinPath = path.join(dir, "stdin");
  writeFileSync(curlPath, `#!/bin/sh\nprintf '%s\\n' "$*" > "$CURL_ARGS_PATH"\ncat > "$CURL_STDIN_PATH"\nprintf '%s\\n%s' "$CURL_BODY" "$CURL_STATUS"\nexit "$CURL_EXIT"\n`);
  chmodSync(curlPath, 0o755);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH}`,
    PROD_URL: "https://health.example.test",
    CURL_ARGS_PATH: argsPath,
    CURL_STDIN_PATH: stdinPath,
    CURL_STATUS: status,
    CURL_BODY: body,
    CURL_EXIT: curlExit,
  };
  if (includeToken) env.HEALTH_READINESS_TOKEN = token;
  else delete env.HEALTH_READINESS_TOKEN;
  const result = spawnSync("bash", ["scripts/check-pipeline.sh", `--${name}`], {
    cwd: process.cwd(),
    encoding: "utf8",
    env,
  });
  return { ...result, args: awaitRead(argsPath), stdin: awaitRead(stdinPath) };
}

function awaitRead(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

afterEach(() => {
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("pipeline health providers", () => {
  it("accepts only healthy liveness JSON, not HTML or a different check", () => {
    const valid = runProvider("health", "200", '{"check":"liveness","status":"healthy","version":"1.0"}');
    expect(valid.status).toBe(0);

    const html = runProvider("health", "200", "<html>login</html>");
    expect(html.status).toBe(1);

    const wrongCheck = runProvider("health", "200", '{"check":"readiness","status":"healthy"}');
    expect(wrongCheck.status).toBe(1);

    expect(runProvider("health", "000", "", "7").status).toBe(1);
  });

  it("sends readiness token on stdin and rejects auth, rate-limit, and database failures", () => {
    const valid = runProvider("health-readiness", "200", '{"check":"readiness","status":"degraded"}');
    expect(valid.status).toBe(0);
    expect(valid.args).toContain("-H @-");
    expect(valid.args).not.toContain(token);
    expect(valid.stdin).toBe(`Authorization: Bearer ${token}\n`);
    expect(valid.stdout + valid.stderr).not.toContain(token);

    for (const status of ["401", "429", "503"]) {
      expect(runProvider("health-readiness", status, '{"error":"failure"}').status).toBe(1);
    }
    expect(runProvider("health-readiness", "000", "", "7").status).toBe(1);
    expect(runProvider("health-readiness", "200", '{"check":"readiness","status":"healthy"}', "0", false).status).toBe(1);
  });
});
