#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# scripts/backup-prod-db.sh
# Creates a timestamped backup of the production database.
#
# Uses Node.js + pg library (Prisma Postgres doesn't
# support pg_dump directly).
#
# Credentials are read from .env.prod (never committed).
# Backups land in ./backups/ (also gitignored).
# ─────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

exec node "$SCRIPT_DIR/backup-prod-db.mjs" "$@"
