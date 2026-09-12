#!/usr/bin/env bash
# One demo entrypoint. Socket Mode (`INTERLOCK_SLACK_APP_TOKEN=xapp-…`) is the
# live ambient path. Without it, managed Slack is mention-only, so we fall back
# to labeled synthetic input.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/load-env.sh
. "$ROOT/scripts/load-env.sh"
load_interlock_env "$ROOT/.env"

app_token="${INTERLOCK_SLACK_APP_TOKEN:-${SLACK_APP_TOKEN:-${INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_APP_TOKEN:-}}}"

cleanup() {
  local pid
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

need_ports() {
  local port holder
  for port in "$@"; do
    if holder="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null)" && [ -n "$holder" ]; then
      printf 'Port %s is already in use by pid %s.\n' "$port" "$(echo "$holder" | tr '\n' ' ')" >&2
      printf 'Stop that run (Ctrl-C its terminal) and retry, or: kill %s\n' "$(echo "$holder" | tr '\n' ' ')" >&2
      exit 1
    fi
  done
}

wait_port() {
  local port="$1"
  for _ in $(seq 50); do
    (exec 3<>/dev/tcp/127.0.0.1/"$port") 2>/dev/null && return 0
    sleep 0.2
  done
  return 1
}

case "$app_token" in
  xapp-*)
    need_ports 4317 3100
    printf '\033[32m  LIVE Socket Mode. Post an ordinary unmentioned message in #incidents.\033[0m\n'
    printf '\033[2m  Do not @-mention the bot. Control Room must not say SYNTHETIC.\033[0m\n'
    npm run coordinator --workspace web &
    wait_port 4317
    npm run start --workspace channel-slack &
    printf '\033[2m  Control Room: http://localhost:3100  (Ctrl-C stops all)\033[0m\n'
    printf '\n  In #incidents, post exactly:\n\n'
    printf '  Hold the prepared checkout candidate until health stays at or below 0.5 for 10 continuous seconds, then promote that exact candidate.\n\n'
    INTERLOCK_COORDINATOR_URL="${INTERLOCK_COORDINATOR_URL:-http://127.0.0.1:4317}" npm run dev --workspace web
    ;;
  *)
    doctor="$(npm run doctor 2>/dev/null || true)"
    channel_status="$(npm run channel:status 2>/dev/null || true)"
    if grep -q 'SLACK attach creds     configured' <<<"$doctor" &&
       grep -q '"slack": "attached"' <<<"$channel_status"; then
      printf '\033[33m  Live Slack attached, but ordinary #incidents messages are not delivered by the managed mention-only adapter.\033[0m\n'
      printf '\033[33m  Falling back to TEST INPUT — SYNTHETIC; do not present this as live Slack evidence.\033[0m\n'
      printf '\033[33m  For ambient pickup: INTERLOCK_SLACK_APP_TOKEN=xapp-… and enable Socket Mode on the Slack app.\033[0m\n'
    else
      printf '\033[2m  Live Slack is unavailable. Using TEST INPUT — SYNTHETIC.\033[0m\n'
    fi
    need_ports 4318 3100
    npm run demo --workspace web -- --reset &
    wait_port 4318
    printf '\033[2m  Control Room: http://localhost:3100 (synthetic; Ctrl-C stops both)\033[0m\n'
    INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev --workspace web
    ;;
esac
