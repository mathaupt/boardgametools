#!/bin/bash

# BoardGameTools OWASP Top 10 guardrail
# Runs lightweight static heuristics + npm audit to catch common issues pre-commit

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SRC_DIR="./src"
ERRORS=0
WARNINGS=0

section() {
  echo -e "\n${GREEN}$1${NC}"
  echo "---------------------------------------"
}

fail() {
  echo -e "${RED}❌ $1${NC}"
  ERRORS=$((ERRORS + 1))
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

section "🔐 OWASP A01 – Broken Access Control"
UNPROTECTED=$(grep -rL "auth\|session" --include="route.ts" "$SRC_DIR/app/api" 2>/dev/null || true)
if [[ -n "$UNPROTECTED" ]]; then
  warn "API routes ohne offensichtliche Auth-Prüfung:\n$UNPROTECTED"
else
  pass "Alle API routes referenzieren Auth"
fi

section "🧾 OWASP A02 – Cryptographic Failures"
PLAINTEXT=$(grep -rn "password\\s*=\\s*['\"]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" | head -5 || true)
if [[ -n "$PLAINTEXT" ]]; then
  warn "Mögliche Plaintext Passwörter:\n$PLAINTEXT"
else
  pass "Keine Klartext Passwörter gefunden"
fi

section "💉 OWASP A03 – Injection"
if grep -rn "eval(" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" >/dev/null; then
  fail "eval() gefunden – Injection Risiko"
else
  pass "Kein eval() gefunden"
fi

if grep -rn "dangerouslySetInnerHTML" "$SRC_DIR" --include="*.tsx" 2>/dev/null >/dev/null; then
  warn "dangerouslySetInnerHTML Nutzung gefunden"
else
  pass "Kein dangerouslySetInnerHTML gefunden"
fi

section "⚙️  OWASP A05 – Security Misconfiguration"
if git ls-files | grep '^\.env' | grep -v '.env.example' >/dev/null; then
  fail ".env Dateien werden versioniert"
else
  pass ".env Dateien sind geschützt"
fi

SECRETS=$(grep -rn -E "(api[_-]?key|secret|token)\\s*[:=]\\s*['\"]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" | head -5 || true)
if [[ -n "$SECRETS" ]]; then
  fail "Hardcoded Secrets gefunden:\n$SECRETS"
else
  pass "Keine Hardcoded Secrets gefunden"
fi

section "📦 OWASP A06 – Vulnerable Components"
if npm audit --audit-level=high --omit=dev; then
  pass "npm audit meldet keine kritischen Probleme"
else
  warn "npm audit meldet Probleme (siehe Ausgabe oben)"
fi

section "🔐 OWASP A07 – Authentication Failures"
HARDCODED=$(grep -rn -E "(password|passwd|secret)" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" | head -5 || true)
if [[ -n "$HARDCODED" ]]; then
  warn "Mögliche hardcoded Credentials:\n$HARDCODED"
else
  pass "Keine hardcoded Credentials gefunden"
fi

section "🌐 OWASP A10 – SSRF"
SSRF=$(grep -rn 'fetch(\s*`' "$SRC_DIR/app/api" --include="*.ts" 2>/dev/null | grep '\$' || true)
if [[ -n "$SSRF" ]]; then
  warn "Dynamische Fetch URLs gefunden – prüfe Input Validation:\n$SSRF"
else
  pass "Keine offensichtlichen SSRF-Risiken"
fi

section "📝 Zusammenfassung"
echo -e "Fehler:    ${RED}${ERRORS}${NC}"
echo -e "Warnungen: ${YELLOW}${WARNINGS}${NC}"

if [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}\nSecurity Check fehlgeschlagen. Bitte Fehler beheben.${NC}"
  STATUS="FEHLGESCHLAGEN"
else
  echo -e "${GREEN}\nSecurity Check bestanden.${NC}"
  STATUS="BESTANDEN"
fi

cat > security-report.md <<EOF
# Security Check Bericht

- Status: $STATUS
- Fehler: $ERRORS
- Warnungen: $WARNINGS
- Datum: $(date '+%Y-%m-%d %H:%M:%S')
- Branch: \
$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
- Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Die folgenden OWASP-Kategorien wurden geprüft: A01, A02, A03, A05, A06, A07, A10.
EOF

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi

exit 0
