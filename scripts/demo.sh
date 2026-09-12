#!/usr/bin/env bash
# One demo entrypoint. The current managed Slack attachment is mention-only, so
# an ordinary message.channels event cannot reach Interlock; detect the attached
# credentials and say why we are using the honest synthetic fallback.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

doctor="$(npm run doctor 2>/dev/null || true)"
channel_status="$(npm run channel:status 2>/dev/null || true)"
if grep -q 'SLACK attach creds     configured' <<<"$doctor" &&
   grep -q '"slack": "attached"' <<<"$channel_status"; then
  printf '\033[33m  Live Slack attached, but ordinary #incidents messages are not delivered by the managed mention-only adapter.\033[0m\n'
  printf '\033[33m  Falling back to TEST INPUT — SYNTHETIC; do not present this as live Slack evidence.\033[0m\n'
else
  printf '\033[2m  Live Slack is unavailable. Using TEST INPUT — SYNTHETIC.\033[0m\n'
fi

cleanup() {
  local pid
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# A leftover run holding either port otherwise surfaces as an EADDRINUSE stack
# trace mid-story, which reads like a product failure during a rehearsal.
for port in 4318 3100; do
  if holder="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null)" && [ -n "$holder" ]; then
    printf 'Port %s is already in use by pid %s.\n' "$port" "$(echo "$holder" | tr '\n' ' ')" >&2
    printf 'Stop that run (Ctrl-C its terminal) and retry, or: kill %s\n' "$(echo "$holder" | tr '\n' ' ')" >&2
    exit 1
  fi
done

npm run demo --workspace web -- --reset &

# Starting the Control Room before the demo coordinator owns 4318 makes its
# first read report coordinator-error instead of the seeded hold.
for _ in $(seq 50); do
  (exec 3<>/dev/tcp/127.0.0.1/4318) 2>/dev/null && break
  sleep 0.2
done

printf '\033[2m  Control Room: http://localhost:3100 (synthetic; Ctrl-C stops both)\033[0m\n'
INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev --workspace web
