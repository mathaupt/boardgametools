# Pipeline check providers

`check-pipeline.sh` is provider-based: each check lives in its own file in
this directory and is **optional**. Missing credentials → the check is
skipped with a warning (exit stays 0); only failing *configured* checks
make the script exit non-zero.

## Provider contract

A provider file `<name>.sh` defines three functions and registers itself:

```bash
pc_<name>_is_configured()   # returns 0 when all env vars/files needed exist
pc_<name>_skip_reason()     # prints why the check is skipped (when unconfigured)
pc_<name>_run()             # performs the check; reports via ok/fail/warn/info

register_check "<name>" "<description>" \
  pc_<name>_is_configured pc_<name>_run pc_<name>_skip_reason
```

Inside `pc_<name>_run` you can use the helpers from `check-pipeline.sh`:

| Helper | Effect |
|---|---|
| `ok "msg" "<name>"` | pass, exit stays 0 |
| `fail "msg" "<name>"` | fail, exit code 1 |
| `warn "msg" "<name>"` | warning (recorded as `skipped`), exit stays 0 |
| `info "msg"` | indented detail line |

Available configuration variables (set by `check-pipeline.sh` before
providers are sourced): `PROD_URL`, `CI_BRANCH`, `GITHUB_REPO`.

## Semantics

- **All checks** run by default; unconfigured ones are skipped with a warning.
- `--<name>` runs only the named check(s); an explicitly selected but
  unconfigured check **fails** (so CI selection never silently passes).
- `--list` shows every registered check and whether it is configured.
- Exit codes: `0` all passed · `1` failure · `2` nothing ran / usage error.

## Token policy

Tokens are **only** read from environment variables — never from committed
files. For convenience, `check-pipeline.sh` sources a local, gitignored
`.env.pipeline-check` file if present:

```bash
# .env.pipeline-check (gitignored via .env*)
GITHUB_TOKEN=github_pat_...
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=...
HEALTH_READINESS_TOKEN=<mindestens-32-zufaellige-Zeichen>
```

## Example: adding a GitLab CI provider

```bash
# scripts/pipeline-checks/gitlab.sh
pc_gitlab_is_configured() {
  [[ -n "${GITLAB_TOKEN:-}" && -n "${GITLAB_PROJECT_ID:-}" ]]
}

pc_gitlab_skip_reason() {
  echo "GITLAB_TOKEN / GITLAB_PROJECT_ID are not set"
}

pc_gitlab_run() {
  echo -e "${CYAN}── GitLab CI (project ${GITLAB_PROJECT_ID}) ──${NC}"
  local resp
  resp=$(curl -sf --max-time 15 \
    -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    "https://gitlab.example.com/api/v4/projects/${GITLAB_PROJECT_ID}/pipelines?ref=main&per_page=1")
  local status
  status=$(jq -r '.[0].status' <<<"$resp")
  if [[ "$status" == "success" ]]; then
    ok "GitLab CI on main is green" "gitlab-ci"
  else
    fail "GitLab CI on main: status=${status}" "gitlab-ci"
  fi
}

register_check "gitlab" "GitLab CI: latest pipeline on main is green" \
  pc_gitlab_is_configured pc_gitlab_run pc_gitlab_skip_reason
```

Then it is picked up automatically: `bash scripts/check-pipeline.sh --list`.
