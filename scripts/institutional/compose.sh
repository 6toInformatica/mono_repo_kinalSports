#!/usr/bin/env bash
# Wrapper de Docker Compose para el stack institucional.
# Uso: ./scripts/institutional/compose.sh <args de docker compose...>
# Ej.: ./scripts/institutional/compose.sh config
#      ./scripts/institutional/compose.sh up --build -d
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${INST_ENV_FILE:-$ROOT_DIR/.env.institutional}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.institutional.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE" >&2
  echo "Copia la plantilla: cp .env.institutional.example .env.institutional" >&2
  exit 1
fi

exec docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
