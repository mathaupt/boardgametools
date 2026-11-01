#!/usr/bin/env bash

# Pipeline Health Check — provider-based CI/deployment checks.
# Every check lives in scripts/pipeline-checks/<name>.sh and is OPTIONAL:
# a check without credentials is skipped with a warning (exit stays 0),
# unless it is explicitly selected via --<name>. Only failing *configured*
# checks make the script exit non-zero.
#
# Usage:
#   bash scripts/check-pipeline.sh               # all configured checks
#   bash scripts/check-pipeline.sh --github      # only the named check(s)
#   bash scripts/check-pipeline.sh --vercel --health
#   bash scripts/check-pipeline.sh --health-readiness
#   bash scripts/check-pipeline.sh --list        # list checks + config state
#   bash scripts/check-pipeline.sh --json        # JSON summary output
#
# Token policy: tokens are ONLY read from environment variables — never
# from committed files. For convenience a local, gitignored
# .env.pipeline-check is sourced if present (see CONFIGURATION below).
#
# Exit codes: 0 all configured checks passed · 1 check failed ·
#             2 nothing ran / usage error.
#
# Adding a provider (e.g. GitLab CI, Netlify, ...):
#   see scripts/pipeline-checks/README.md

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ════════════════════════════════════════════════════════════════════════
# CONFIGURATION — adapt this block when copying to another project
# ════════════════════════════════════════════════════════════════════════

# Project root (this script lives in <root>/scripts/):
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Local, gitignored env file for tokens (convenience only; existing env
# vars are still the documented interface). NEVER commit this file.
# Location: <project root>/.env.pipeline-check
if [[ -f "$PROJECT_ROOT/.env.pipeline-check" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env.pipeline-check"
  set +a
fi

# Health check target:
PROD_URL="${PROD_URL:-https://boardgametools.vercel.app}"
# Branch that must be green in CI:
CI_BRANCH="${CI_BRANCH:-main}"
# GitHub repo ("owner/repo"): derived from git remote "origin" when unset.
derive_github_repo_from_origin() {
  command -v git >/dev/null 2>&1 || return 1
  local url
  url=$(git remote get-url origin 2>/dev/null) || return 1
  case "$url" in
    git@github.com:*)       url="${url#git@github.com:}" ;;
    ssh://git@github.com/*) url="${url#ssh://git@github.com/}" ;;
    https://github.com/*)   url="${url#https://github.com/}" ;;
    *) return 1 ;;
  esac
  url="${url%.git}"
  case "$url" in */*) GITHUB_REPO="$url"; return 0 ;; *) return 1 ;; esac
}
GITHUB_REPO="${GITHUB_REPO:-}"
if [[ -z "$GITHUB_REPO" ]] && ! derive_github_repo_from_origin; then
  GITHUB_REPO="mathaupt/boardgametools"
fi
# ════════════════════════════════════════════════════════════════════════

# --- Check registry + result helpers ---
CHECK_NAMES=()
CHECK_DESC=()
CHECK_IS_CONFIGURED=()
CHECK_RUN=()
CHECK_SKIP_REASON=()
RESULTS=""
FAILED=0
RAN_ANY=false

register_check() { # name description is_configured_fn run_fn skip_reason_fn
  CHECK_NAMES+=("$1")
  CHECK_DESC+=("$2")
  CHECK_IS_CONFIGURED+=("$3")
  CHECK_RUN+=("$4")
  CHECK_SKIP_REASON+=("$5")
}

record() { # status check detail
  RESULTS="${RESULTS:+$RESULTS
}{\"status\":\"$1\",\"check\":\"$2\",\"detail\":\"$3\"}"
}
out() { # human-readable output: stdout normally, stderr in --json mode
  if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo -e "$1" >&2
  else
    echo -e "$1"
  fi
}
banner() {
  out "${CYAN}$1${NC}"
}
ok() {
  out "${GREEN}✓ $1${NC}"
  record "pass" "$2" "$1"
}
fail() {
  out "${RED}✗ $1${NC}"
  record "fail" "$2" "$1"
  FAILED=1
}
warn() {
  out "${YELLOW}⚠ $1${NC}"
  record "skipped" "$2" "$1"
}
info() {
  out "${CYAN}  $1${NC}"
}

# --- Load providers ---
CHECKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/pipeline-checks"
shopt -s nullglob
for provider_file in "$CHECKS_DIR"/*.sh; do
  # shellcheck source=/dev/null
  source "$provider_file"
done
shopt -u nullglob

if [[ ${#CHECK_NAMES[@]} -eq 0 ]]; then
  echo -e "${RED}✗ No providers found in $CHECKS_DIR${NC}" >&2
  exit 2
fi

is_registered() {
  local all=" ${CHECK_NAMES[*]} "
  [[ "$all" == *" $1 "* ]]
}

print_help() {
  cat <<'EOF'
Pipeline Health Check — provider-based CI/deployment checks

Usage:
  bash scripts/check-pipeline.sh               # all configured checks
  bash scripts/check-pipeline.sh --github      # only the named check(s)
  bash scripts/check-pipeline.sh --vercel --health
  bash scripts/check-pipeline.sh --health-readiness
  bash scripts/check-pipeline.sh --list        # list checks + config state
  bash scripts/check-pipeline.sh --json        # JSON summary output

Semantics:
  Checks are optional. Without credentials a check is skipped (warning,
  exit 0); only failing configured checks make the script exit 1. An
  explicitly selected (--name) but unconfigured check fails.

Tokens (env vars only, never committed files):
  GITHUB_TOKEN        fine-grained PAT with "Actions: read"
  VERCEL_TOKEN        Vercel API token
  VERCEL_PROJECT_ID   Vercel project ID (or .vercel/project.json)
  VERCEL_TEAM_ID      optional team scope
  HEALTH_READINESS_TOKEN  separate random bearer secret (minimum 32 characters)

Convenience: a gitignored .env.pipeline-check file is sourced if present
(location: project root, next to package.json).

Adding a provider: see scripts/pipeline-checks/README.md
EOF
}

# --- Argument parsing ---
SELECTED=""
JSON_OUTPUT=false
LIST_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json) JSON_OUTPUT=true; shift ;;
    --list) LIST_ONLY=true; shift ;;
    -h|--help) print_help; exit 0 ;;
    --*) SELECTED="${SELECTED:+$SELECTED,}${1#--}"; shift ;;
    *) echo -e "${RED}Unknown argument: $1${NC}" >&2; exit 2 ;;
  esac
done

if [[ -n "$SELECTED" ]]; then
  IFS=',' read -r -a selected_arr <<<"$SELECTED"
  for s in "${selected_arr[@]}"; do
    if ! is_registered "$s"; then
      echo -e "${RED}✗ Unknown check: --$s (see --list)${NC}" >&2
      exit 2
    fi
  done
fi

# --- List mode ---
if [[ "$LIST_ONLY" == "true" ]]; then
  echo "Registered pipeline checks:"
  for i in "${!CHECK_NAMES[@]}"; do
    if "${CHECK_IS_CONFIGURED[$i]}" 2>/dev/null; then
      state="configured"
    else
      state="not configured"
    fi
    printf '  %-8s %-52s %s\n' "${CHECK_NAMES[$i]}" "${CHECK_DESC[$i]}" "$state"
  done
  exit 0
fi

# --- Run checks ---
for i in "${!CHECK_NAMES[@]}"; do
  name="${CHECK_NAMES[$i]}"
  if [[ -n "$SELECTED" ]] && [[ ",$SELECTED," != *",$name,"* ]]; then
    continue
  fi
  out ""
  if "${CHECK_IS_CONFIGURED[$i]}" 2>/dev/null; then
    "${CHECK_RUN[$i]}"
    RAN_ANY=true
  elif [[ -n "$SELECTED" ]]; then
    fail "skipped: $("${CHECK_SKIP_REASON[$i]}")" "$name"
  else
    warn "skipped: $("${CHECK_SKIP_REASON[$i]}")" "$name"
  fi
done

# --- Summary ---
if [[ "$JSON_OUTPUT" == "true" ]]; then
  if [[ -z "$RESULTS" ]]; then
    echo "[]"
  else
    printf '%s\n' "$RESULTS" | jq -s .
  fi
else
  echo ""
  if [[ "$FAILED" -eq 0 && "$RAN_ANY" == "false" ]]; then
    echo -e "${YELLOW}SKIP${NC} — no checks ran (credentials missing)"
    exit 2
  fi
  if [[ "$FAILED" -ne 0 ]]; then
    echo -e "${RED}FAIL${NC} — at least one check failed"
    exit 1
  fi
  echo -e "${GREEN}PASS${NC} — pipeline and deployment healthy"
fi

if [[ "$FAILED" -eq 0 && "$RAN_ANY" == "false" ]]; then
  exit 2
fi
if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi
exit 0
