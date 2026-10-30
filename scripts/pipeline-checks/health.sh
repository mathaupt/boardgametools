#!/usr/bin/env bash
# Provider: health — production health endpoint check
#
# Env vars:
#   PROD_URL    (optional) — default from check-pipeline.sh CONFIGURATION
#   HEALTH_PATH (optional) — default: /api/health

pc_health_is_configured() {
  [[ -n "${PROD_URL:-}" ]]
}

pc_health_skip_reason() {
  echo "PROD_URL is not set"
}

pc_health_run() {
  banner "── Production health (${PROD_URL}${HEALTH_PATH:-/api/health}) ──"

  local code
  if ! code=$(curl -s -o /dev/null --max-time 15 -w '%{http_code}' \
      "${PROD_URL}${HEALTH_PATH:-/api/health}"); then
    fail "Health endpoint unreachable (${PROD_URL}${HEALTH_PATH:-/api/health})" "prod-health"
    return 0
  fi
  info "HTTP status: ${code}"

  if [[ "$code" == "200" ]]; then
    ok "Health endpoint returns 200" "prod-health"
  else
    fail "Health endpoint returned HTTP ${code} (expected 200)" "prod-health"
  fi
}

register_check "health" "Production health endpoint returns 200" \
  pc_health_is_configured pc_health_run pc_health_skip_reason
