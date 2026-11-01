// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDirs: string[] = [];
const token = "vercel-token-test-secret-not-an-argument";

function invokeProvider() {
  const dir = mkdtempSync(path.join(tmpdir(), "bgt-vercel-provider-"));
  tempDirs.push(dir);
  const curlPath = path.join(dir, "curl");
  const argsPath = path.join(dir, "args");
  const stdinPath = path.join(dir, "stdin");
  writeFileSync(curlPath, `#!/bin/sh\nprintf '%s\\n' "$*" > "$CURL_ARGS_PATH"\ncat > "$CURL_STDIN_PATH"\nprintf '%s' "$CURL_RESPONSE"\n`);
  chmodSync(curlPath, 0o755);

  const result = spawnSync("bash", ["-c", 'register_check() { :; }; banner() { :; }; info() { :; }; ok() { echo "$1"; }; fail() { echo "$1" >&2; }; warn() { :; }; source "$PROVIDER_PATH"; pc_vercel_run'], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      PROVIDER_PATH: path.join(process.cwd(), "scripts/pipeline-checks/vercel.sh"),
      VERCEL_TOKEN: token,
      VERCEL_PROJECT_ID: "prj_test_health",
      VERCEL_TEAM_ID: "team_test",
      CURL_ARGS_PATH: argsPath,
      CURL_STDIN_PATH: stdinPath,
      CURL_RESPONSE: '{"deployments":[{"readyState":"READY","url":"deployment.example.test","created":1761960000000}]}',
    },
  });

  return {
    ...result,
    args: readFileSync(argsPath, "utf8"),
    stdin: readFileSync(stdinPath, "utf8"),
  };
}

afterEach(() => {
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("Vercel pipeline provider", () => {
  it("sends the API token on curl stdin, not in process arguments", () => {
    const result = invokeProvider();

    expect(result.status, result.stderr).toBe(0);
    expect(result.args).toContain("-H @-");
    expect(result.args).not.toContain(token);
    expect(result.stdin).toBe(`Authorization: Bearer ${token}\n`);
    expect(result.stdout + result.stderr).not.toContain(token);
  });
});
