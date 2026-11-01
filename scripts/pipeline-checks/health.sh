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

  local response code body
  if ! response=$(curl -sS --max-time 15 -w $'\n%{http_code}' \
      "${PROD_URL}${HEALTH_PATH:-/api/health}"); then
    fail "Health endpoint unreachable (${PROD_URL}${HEALTH_PATH:-/api/health})" "prod-health"
    return 0
  fi
  code="${response##*$'\n'}"
  body="${response%$'\n'*}"
  info "HTTP status: ${code}"

  if [[ "$code" == "200" ]] && jq -e '.check == "liveness" and .status == "healthy" and (.version | type == "string")' >/dev/null 2>&1 <<<"$body"; then
    ok "Liveness returns a valid healthy JSON contract" "prod-health"
  else
    fail "Liveness response is invalid (HTTP ${code})" "prod-health"
  fi
}

register_check "health" "Production health endpoint returns 200" \
  pc_health_is_configured pc_health_run pc_health_skip_reason
