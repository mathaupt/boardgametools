#!/bin/bash

# BoardGameTools Security & Privacy Guardrail
# OWASP Top 10 + DSGVO/Datenschutz heuristics for pre-commit
#
# Usage:
#   bash scripts/security-check.sh              # run all checks
#   bash scripts/security-check.sh --only A01   # run single check
#   bash scripts/security-check.sh --list       # list available checks
#   bash scripts/security-check.sh --strict     # treat warnings as errors
#   bash scripts/security-check.sh --json       # output JSON summary
#   bash scripts/security-check.sh --no-audit   # skip npm audit (faster)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SRC_DIR="./src"
ERRORS=0
WARNINGS=0
STRICT=false
JSON_OUTPUT=false
SKIP_AUDIT=false
ONLY_CHECK=""
RESULTS=()

# --- CLI argument parsing ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --only)    ONLY_CHECK="$2"; shift 2 ;;
    --strict)  STRICT=true; shift ;;
    --json)    JSON_OUTPUT=true; shift ;;
    --no-audit) SKIP_AUDIT=true; shift ;;
    --list)
      echo "Available checks:"
      echo "  A01  Broken Access Control"
      echo "  A02  Cryptographic Failures"
      echo "  A03  Injection"
      echo "  A04  Insecure Design (debug endpoints)"
      echo "  A05  Security Misconfiguration"
      echo "  A06  Vulnerable Components (npm audit)"
      echo "  A07  Authentication Failures"
      echo "  A08  Software & Data Integrity"
      echo "  A09  Security Logging & Monitoring"
      echo "  A10  SSRF"
      echo "  PII  Datenschutz / PII Leaks"
      exit 0 ;;
    --help|-h)
      echo "Usage: $0 [--only CHECK] [--strict] [--json] [--no-audit] [--list]"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

should_run() {
  [[ -z "$ONLY_CHECK" ]] || [[ "$ONLY_CHECK" == "$1" ]]
}

# Escape string for safe JSON embedding (newlines, quotes, backslashes, tabs)
json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' | tr '\n' ' '
}

section() {
  if ! $JSON_OUTPUT; then
    echo -e "\n${GREEN}$1${NC}"
    echo "---------------------------------------"
  fi
}

fail() {
  if ! $JSON_OUTPUT; then
    echo -e "${RED}❌ $1${NC}"
  fi
  ERRORS=$((ERRORS + 1))
  local escaped
  escaped=$(json_escape "$1")
  RESULTS+=("{\"level\":\"error\",\"check\":\"$2\",\"message\":\"$escaped\"}")
}

warn() {
  if $STRICT; then
    fail "$1" "$2"
    return
  fi
  if ! $JSON_OUTPUT; then
    echo -e "${YELLOW}⚠️  $1${NC}"
  fi
  WARNINGS=$((WARNINGS + 1))
  local escaped
  escaped=$(json_escape "$1")
  RESULTS+=("{\"level\":\"warning\",\"check\":\"$2\",\"message\":\"$escaped\"}")
}

pass() {
  if ! $JSON_OUTPUT; then
    echo -e "${GREEN}✅ $1${NC}"
  fi
  local escaped
  escaped=$(json_escape "$1")
  RESULTS+=("{\"level\":\"pass\",\"check\":\"$2\",\"message\":\"$escaped\"}")
}

# ============================================================
# A01 – Broken Access Control
# ============================================================
if should_run "A01"; then
  section "🔐 OWASP A01 – Broken Access Control"
  # Exclude known public routes from the check
  PUBLIC_ROUTES="auth/|public/|db/init|debug/|health|bgg/"
  UNPROTECTED=$(grep -rL "auth\|session" --include="route.ts" "$SRC_DIR/app/api" 2>/dev/null \
    | grep -vE "$PUBLIC_ROUTES" || true)
  if [[ -n "$UNPROTECTED" ]]; then
    fail "Geschützte API routes ohne Auth-Prüfung:\n$UNPROTECTED" "A01"
  else
    pass "Alle geschützten API routes referenzieren Auth" "A01"
  fi
fi

# ============================================================
# A02 – Cryptographic Failures
# ============================================================
if should_run "A02"; then
  section "🧾 OWASP A02 – Cryptographic Failures"

  # Check for plaintext passwords in code (not in state declarations)
  PLAINTEXT=$(grep -rn "password\\s*=\\s*['\"][^\"]*['\"]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "process.env" | grep -v "useState" | grep -v "setPassword" \
    | grep -v "\.test\." | grep -v "passwordHash" | head -5 || true)
  if [[ -n "$PLAINTEXT" ]]; then
    warn "Mögliche Plaintext Passwörter:\n$PLAINTEXT" "A02"
  else
    pass "Keine Klartext Passwörter gefunden" "A02"
  fi

  # Check for weak hashing (MD5, SHA1 for passwords)
  WEAK_HASH=$(grep -rn "createHash.*md5\|createHash.*sha1\|md5(\|sha1(" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 || true)
  if [[ -n "$WEAK_HASH" ]]; then
    fail "Schwache Hash-Algorithmen gefunden (MD5/SHA1):\n$WEAK_HASH" "A02"
  else
    pass "Keine schwachen Hash-Algorithmen" "A02"
  fi
fi

# ============================================================
# A03 – Injection
# ============================================================
if should_run "A03"; then
  section "💉 OWASP A03 – Injection"

  if grep -rn "eval(" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" >/dev/null; then
    fail "eval() gefunden – Injection Risiko" "A03"
  else
    pass "Kein eval() gefunden" "A03"
  fi

  if grep -rn "dangerouslySetInnerHTML" "$SRC_DIR" --include="*.tsx" 2>/dev/null >/dev/null; then
    warn "dangerouslySetInnerHTML Nutzung gefunden – XSS prüfen" "A03"
  else
    pass "Kein dangerouslySetInnerHTML gefunden" "A03"
  fi

  # Check for raw SQL / $executeRaw without parameterization
  RAW_SQL=$(grep -rn '\$executeRaw\|prisma\.\$queryRaw' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 || true)
  if [[ -n "$RAW_SQL" ]]; then
    warn "Raw SQL Queries gefunden – SQL Injection prüfen:\n$RAW_SQL" "A03"
  else
    pass "Keine Raw SQL Queries" "A03"
  fi
fi

# ============================================================
# A04 – Insecure Design (debug/dev endpoints in production code)
# ============================================================
if should_run "A04"; then
  section "🏗️  OWASP A04 – Insecure Design"

  # Check for debug/dev API endpoints
  DEBUG_ROUTES=$(find "$SRC_DIR/app/api" -path "*/debug/*" -name "route.ts" -o -path "*/dev/*" -name "route.ts" 2>/dev/null || true)
  if [[ -n "$DEBUG_ROUTES" ]]; then
    warn "Debug/Dev API Routes gefunden – in Produktion deaktivieren:\n$DEBUG_ROUTES" "A04"
  else
    pass "Keine Debug/Dev API Routes" "A04"
  fi

  # Check for unprotected db/init routes
  INIT_ROUTES=$(find "$SRC_DIR/app/api" -path "*/db/init*" -name "route.ts" 2>/dev/null || true)
  if [[ -n "$INIT_ROUTES" ]]; then
    # Verify they have auth checks
    INIT_UNPROTECTED=$(grep -L "auth\|ADMIN\|isAdmin" $INIT_ROUTES 2>/dev/null || true)
    if [[ -n "$INIT_UNPROTECTED" ]]; then
      warn "DB-Init Route ohne Admin-Prüfung:\n$INIT_UNPROTECTED" "A04"
    else
      pass "DB-Init Route ist geschützt" "A04"
    fi
  else
    pass "Keine DB-Init Routes" "A04"
  fi
fi

# ============================================================
# A05 – Security Misconfiguration
# ============================================================
if should_run "A05"; then
  section "⚙️  OWASP A05 – Security Misconfiguration"

  if git ls-files 2>/dev/null | grep '^\.env' | grep -v '.env.example' >/dev/null 2>&1; then
    fail ".env Dateien werden versioniert" "A05"
  else
    pass ".env Dateien sind geschützt" "A05"
  fi

  SECRETS=$(grep -rn -E "(api[_-]?key|secret|token)\s*[:=]\s*['\"][a-zA-Z0-9]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "process.env" | grep -v "shareToken" | grep -v "\.test\." \
    | grep -v "resetToken" | grep -v "encryptId\|decryptId" | head -5 || true)
  if [[ -n "$SECRETS" ]]; then
    fail "Hardcoded Secrets gefunden:\n$SECRETS" "A05"
  else
    pass "Keine Hardcoded Secrets gefunden" "A05"
  fi

  # Check for overly permissive CORS headers
  CORS=$(grep -rn "Access-Control-Allow-Origin.*\*" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 || true)
  if [[ -n "$CORS" ]]; then
    warn "Wildcard CORS Header gefunden:\n$CORS" "A05"
  else
    pass "Kein Wildcard CORS" "A05"
  fi
fi

# ============================================================
# A06 – Vulnerable Components
# ============================================================
if should_run "A06"; then
  section "📦 OWASP A06 – Vulnerable Components"
  if $SKIP_AUDIT; then
    pass "npm audit übersprungen (--no-audit)" "A06"
  elif npm audit --audit-level=high --omit=dev 2>/dev/null; then
    pass "npm audit meldet keine kritischen Probleme" "A06"
  else
    warn "npm audit meldet Probleme (siehe Ausgabe oben)" "A06"
  fi
fi

# ============================================================
# A07 – Authentication Failures
# ============================================================
if should_run "A07"; then
  section "🔐 OWASP A07 – Authentication Failures"

  # Smarter check: exclude UI state variables, type definitions, hash operations
  HARDCODED=$(grep -rn -E "(password|passwd|secret)\s*[:=]\s*['\"][^\"]{3,}" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "process.env" | grep -v "useState" | grep -v "setPassword" \
    | grep -v "\.test\." | grep -v "passwordHash" | grep -v "Hash\|hash(" \
    | grep -v "type \|interface " | grep -v "NEXTAUTH_SECRET" \
    | head -5 || true)
  if [[ -n "$HARDCODED" ]]; then
    warn "Mögliche hardcoded Credentials:\n$HARDCODED" "A07"
  else
    pass "Keine hardcoded Credentials gefunden" "A07"
  fi

  # Check for missing rate limiting indicators on auth routes
  AUTH_ROUTES=$(find "$SRC_DIR/app/api/auth" -name "route.ts" 2>/dev/null || true)
  if [[ -n "$AUTH_ROUTES" ]]; then
    NO_RATE_LIMIT=$(grep -rL "rateLimit\|rateLimiter\|attempts\|MAX_" $AUTH_ROUTES 2>/dev/null || true)
    if [[ -n "$NO_RATE_LIMIT" ]]; then
      warn "Auth Routes ohne Rate Limiting:\n$NO_RATE_LIMIT" "A07"
    else
      pass "Auth Routes haben Rate Limiting" "A07"
    fi
  fi
fi

# ============================================================
# A08 – Software and Data Integrity Failures
# ============================================================
if should_run "A08"; then
  section "🔒 OWASP A08 – Software & Data Integrity"

  # Check for npm lockfile existence
  if [[ -f "package-lock.json" ]] || [[ -f "yarn.lock" ]] || [[ -f "pnpm-lock.yaml" ]]; then
    pass "Lockfile vorhanden – Dependencies sind gelockt" "A08"
  else
    fail "Kein Lockfile gefunden – Supply Chain Risiko" "A08"
  fi

  # Check for integrity scripts in package.json
  if grep -q '"prepare"' package.json 2>/dev/null; then
    pass "prepare-Script vorhanden (Husky)" "A08"
  else
    warn "Kein prepare-Script – Pre-Commit Hooks könnten fehlen" "A08"
  fi
fi

# ============================================================
# A09 – Security Logging & Monitoring Failures
# ============================================================
if should_run "A09"; then
  section "📊 OWASP A09 – Security Logging & Monitoring"

  # Check that auth failures are logged
  AUTH_FAIL_LOGGED=$(grep -rn "401\|Unauthorized\|Unauthenticated" "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null | head -3 || true)
  if [[ -n "$AUTH_FAIL_LOGGED" ]]; then
    pass "Auth-Fehler werden mit Status 401 zurückgegeben" "A09"
  else
    warn "Keine 401-Responses gefunden – Auth-Fehler werden nicht gemeldet" "A09"
  fi

  # Verify error handling exists in API routes
  ERROR_HANDLING=$(grep -rn "catch\|500\|Internal Server Error" "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null | head -1 || true)
  if [[ -n "$ERROR_HANDLING" ]]; then
    pass "Error Handling in API Routes vorhanden" "A09"
  else
    warn "Kein Error Handling in API Routes gefunden" "A09"
  fi
fi

# ============================================================
# A10 – SSRF
# ============================================================
if should_run "A10"; then
  section "🌐 OWASP A10 – SSRF"
  SSRF=$(grep -rn 'fetch(\s*`' "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null | grep '\$' || true)
  if [[ -n "$SSRF" ]]; then
    warn "Dynamische Fetch URLs gefunden – prüfe Input Validation:\n$SSRF" "A10"
  else
    pass "Keine offensichtlichen SSRF-Risiken" "A10"
  fi
fi

# ============================================================
# PII – Datenschutz / DSGVO / Privacy Leaks
# ============================================================
if should_run "PII"; then
  section "🛡️  Datenschutz – PII / DSGVO"

  # Check for console.log leaking sensitive data
  PII_LOGS=$(grep -rn "console\.\(log\|info\|debug\).*\(email\|password\|session\|user\.\|token\)" \
    "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "node_modules" | head -10 || true)
  if [[ -n "$PII_LOGS" ]]; then
    warn "console.log mit möglichen personenbezogenen Daten:\n$PII_LOGS" "PII"
  else
    pass "Keine PII-Leaks in console.log" "PII"
  fi

  # Check for sensitive data in URL params (GET)
  PII_URL=$(grep -rn "searchParams.*\(email\|password\|token\|secret\)" "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null \
    | grep -v "shareToken\|resetToken" | head -5 || true)
  if [[ -n "$PII_URL" ]]; then
    warn "Sensible Daten in URL Query Params:\n$PII_URL" "PII"
  else
    pass "Keine sensiblen Daten in URL Params" "PII"
  fi

  # Check for unencrypted personal data storage patterns
  PII_STORE=$(grep -rn "create\|update" "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null \
    | grep -i "email.*plain\|name.*unencrypt" | head -5 || true)
  if [[ -n "$PII_STORE" ]]; then
    warn "Mögliche unverschlüsselte PII-Speicherung:\n$PII_STORE" "PII"
  else
    pass "Keine offensichtlichen PII-Speicherungsprobleme" "PII"
  fi
fi

# ============================================================
# Summary
# ============================================================
section "📝 Zusammenfassung"
TOTAL=$((ERRORS + WARNINGS))
CHECKS_RUN=$(echo "${RESULTS[@]}" | grep -o '"check"' | wc -l || echo "0")

if ! $JSON_OUTPUT; then
  echo -e "Fehler:    ${RED}${ERRORS}${NC}"
  echo -e "Warnungen: ${YELLOW}${WARNINGS}${NC}"
fi

if [[ $ERRORS -gt 0 ]]; then
  STATUS="FEHLGESCHLAGEN"
  if ! $JSON_OUTPUT; then
    echo -e "${RED}\nSecurity Check fehlgeschlagen. Bitte Fehler beheben.${NC}"
  fi
else
  STATUS="BESTANDEN"
  if ! $JSON_OUTPUT; then
    echo -e "${GREEN}\nSecurity Check bestanden.${NC}"
  fi
fi

# JSON output
if $JSON_OUTPUT; then
  RESULTS_JSON=$(printf '%s,' "${RESULTS[@]}")
  RESULTS_JSON="[${RESULTS_JSON%,}]"
  cat <<ENDJSON
{
  "status": "$STATUS",
  "errors": $ERRORS,
  "warnings": $WARNINGS,
  "date": "$(date '+%Y-%m-%dT%H:%M:%S')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "results": $RESULTS_JSON
}
ENDJSON
fi

# Write report
cat > security-report.md <<EOF
# Security Check Bericht

- Status: $STATUS
- Fehler: $ERRORS
- Warnungen: $WARNINGS
- Datum: $(date '+%Y-%m-%d %H:%M:%S')
- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
- Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Geprüfte Kategorien: A01, A02, A03, A04, A05, A06, A07, A08, A09, A10, PII (Datenschutz).
EOF

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi

exit 0
