#!/usr/bin/env bash
# Provider: health-readiness — authenticated production database readiness.
# HEALTH_READINESS_TOKEN is sent through curl's stdin header file so it is
# absent from process arguments, URLs, and command output.

pc_health_readiness_is_configured() {
  local token="${HEALTH_READINESS_TOKEN:-}"
  [[ -n "${PROD_URL:-}" && ${#token} -ge 32 ]]
}

pc_health_readiness_skip_reason() {
  echo "PROD_URL or HEALTH_READINESS_TOKEN (at least 32 characters) is not set"
}

pc_health_readiness_run() {
  local endpoint response code body
  endpoint="${PROD_URL}/api/health/ready"
  banner "── Production readiness (${PROD_URL}/api/health/ready) ──"

  if ! response=$(printf 'Authorization: Bearer %s\n' "$HEALTH_READINESS_TOKEN" | \
      curl -sS --max-time 15 -H @- -w $'\n%{http_code}' "$endpoint"); then
    fail "Readiness endpoint unreachable" "prod-readiness"
    return 0
  fi
  code="${response##*$'\n'}"
  body="${response%$'\n'*}"
  info "HTTP status: ${code}"

  if [[ "$code" == "200" ]] && jq -e '.check == "readiness" and (.status == "healthy" or .status == "degraded")' >/dev/null 2>&1 <<<"$body"; then
    ok "Readiness returns a valid ready JSON contract" "prod-readiness"
  else
    fail "Readiness response is invalid or the database is unavailable (HTTP ${code})" "prod-readiness"
  fi
}

register_check "health-readiness" "Authenticated database readiness endpoint is ready" \
  pc_health_readiness_is_configured pc_health_readiness_run pc_health_readiness_skip_reason
