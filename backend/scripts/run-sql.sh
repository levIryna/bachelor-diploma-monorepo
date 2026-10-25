#!/usr/bin/env bash
# Usage: ./scripts/run-sql.sh path/to/file.sql
# Run from backend/ (or any cwd — paths are relative to backend/).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/../docker-compose.yml"
SQL_FILE="${1:?SQL file path required}"

if [[ ! -f "$SQL_FILE" ]]; then
  if [[ -f "$ROOT/$SQL_FILE" ]]; then
    SQL_FILE="$ROOT/$SQL_FILE"
  else
    echo "File not found: $1" >&2
    exit 1
  fi
fi

DOCKER="${DOCKER:-docker}"
COMPOSE=( "$DOCKER" compose -f "$COMPOSE_FILE" )

cat "$SQL_FILE" | "${COMPOSE[@]}" exec -T db psql -U app -d procurement -v ON_ERROR_STOP=1
