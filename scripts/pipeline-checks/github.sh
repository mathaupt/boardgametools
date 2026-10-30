#!/usr/bin/env bash
# Provider: github — GitHub Actions pipeline status
#
# Env vars:
#   GITHUB_TOKEN (required) — fine-grained PAT with "Actions: read"
#   GITHUB_REPO  (optional) — "owner/repo"; derived by check-pipeline.sh
#                             from git remote "origin" when unset
#   CI_BRANCH    (optional) — branch that must be green (default: main)

pc_github_is_configured() {
  [[ -n "${GITHUB_TOKEN:-}" ]]
}

pc_github_skip_reason() {
  echo "GITHUB_TOKEN is not set (fine-grained PAT with 'Actions: read')"
}

pc_github_run() {
  banner "── GitHub Actions (${GITHUB_REPO}, branch: ${CI_BRANCH}) ──"

  local resp
  if ! resp=$(curl -sf --max-time 15 \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${GITHUB_REPO}/actions/runs?branch=${CI_BRANCH}&per_page=1"); then
    fail "GitHub API request failed (network or token?)" "github-ci"
    return 0
  fi

  local status conclusion name run_url created_at
  status=$(jq -r '.workflow_runs[0].status // "unknown"' <<<"$resp")
  conclusion=$(jq -r '.workflow_runs[0].conclusion // "null"' <<<"$resp")
  name=$(jq -r '.workflow_runs[0].name // "unknown"' <<<"$resp")
  run_url=$(jq -r '.workflow_runs[0].html_url // ""' <<<"$resp")
  created_at=$(jq -r '.workflow_runs[0].created_at // ""' <<<"$resp")

  info "last run: ${name} (${created_at}) status=${status} conclusion=${conclusion}"
  [[ -n "$run_url" ]] && info "$run_url"

  if [[ "$conclusion" == "success" ]]; then
    ok "GitHub CI on ${CI_BRANCH} is green" "github-ci"
  elif [[ "$status" != "completed" ]]; then
    warn "GitHub CI on ${CI_BRANCH} still ${status}" "github-ci"
  else
    fail "GitHub CI on ${CI_BRANCH}: conclusion=${conclusion}" "github-ci"
  fi
}

register_check "github" "GitHub Actions: latest run on CI branch is green" \
  pc_github_is_configured pc_github_run pc_github_skip_reason
