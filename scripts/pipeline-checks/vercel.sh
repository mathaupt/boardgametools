#!/usr/bin/env bash
# Provider: vercel — Vercel production deployment status
#
# Env vars:
#   VERCEL_TOKEN       (required) — Vercel API token
#   VERCEL_PROJECT_ID  (required) — or .vercel/project.json (after `vercel link`)
#   VERCEL_TEAM_ID     (optional) — team scope for the Vercel API

resolve_vercel_project_id() {
  if [[ -n "${VERCEL_PROJECT_ID:-}" ]]; then
    return 0
  fi
  local pf=".vercel/project.json"
  if [[ -f "$pf" ]]; then
    VERCEL_PROJECT_ID="$(jq -r '.projectId // empty' "$pf" 2>/dev/null || true)"
  fi
  [[ -n "${VERCEL_PROJECT_ID:-}" ]]
}

pc_vercel_is_configured() {
  [[ -n "${VERCEL_TOKEN:-}" ]] && resolve_vercel_project_id
}

pc_vercel_skip_reason() {
  if [[ -z "${VERCEL_TOKEN:-}" ]]; then
    echo "VERCEL_TOKEN is not set"
  else
    echo "VERCEL_PROJECT_ID is not set and .vercel/project.json not found (run 'vercel link')"
  fi
}

pc_vercel_run() {
  banner "── Vercel (production deployments) ──"

  local api="https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=1"
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    api="${api}&teamId=${VERCEL_TEAM_ID}"
  fi

  local resp
  if ! resp=$(curl -sf --max-time 15 \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" "$api"); then
    fail "Vercel API request failed (network, token, or project/team ID?)" "vercel-deploy"
    return 0
  fi

  local count state url created
  count=$(jq -r '.deployments | length' <<<"$resp")
  if [[ "$count" -eq 0 ]]; then
    fail "No production deployment found for project ${VERCEL_PROJECT_ID}" "vercel-deploy"
    return 0
  fi

  state=$(jq -r '.deployments[0].readyState' <<<"$resp")
  url=$(jq -r '.deployments[0].url // ""' <<<"$resp")
  created=$(jq -r '.deployments[0].created' <<<"$resp")
  local created_iso
  created_iso=$(date -r "$((created / 1000))" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "n/a")

  info "last production deployment: ${url} (${created_iso}) state=${state}"

  if [[ "$state" == "READY" ]]; then
    ok "Vercel production deployment is READY" "vercel-deploy"
  else
    fail "Vercel production deployment state=${state} (expected READY)" "vercel-deploy"
  fi
}

register_check "vercel" "Vercel: latest production deployment is READY" \
  pc_vercel_is_configured pc_vercel_run pc_vercel_skip_reason
