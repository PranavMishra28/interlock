#!/usr/bin/env bash
# Picks the surface you have actually configured, so `npm run dev` always does
# something useful instead of crashing on a missing CHANNEL_CODE.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/load-env.sh
. "$ROOT/scripts/load-env.sh"
load_interlock_env "$ROOT/.env"

cleanup() {
  local pid
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

npm run coordinator --workspace web &
npm run dev --workspace web &

if [ -n "${CHANNEL_CODE:-}" ] && [ -n "${INTELLIGENCE_API_KEY:-}" ]; then
  npm run dev --workspace channel-slack
else
  printf '\033[2m  Slack is not configured. Control Room is on 127.0.0.1:3100.\n'
  printf '  Fill INTELLIGENCE_API_KEY and CHANNEL_CODE for ambient Slack.\033[0m\n'
  wait
fi
