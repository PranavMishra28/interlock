#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
status=$(printf '%s' "$input" | jq -r '.status // ""')
loop_count=$(printf '%s' "$input" | jq -r '.loop_count // 0')
log="$(git rev-parse --git-dir)/interlock-hook-events"

if [ "$status" != completed ]; then
  printf '%s\tstop:%s:no-followup\n' "$(date -u +%FT%TZ)" "$status" >> "$log"
  echo '{}'
elif bash scripts/check-evidence.sh verify >/dev/null 2>&1; then
  printf '%s\tstop:completed:evidence-current\n' "$(date -u +%FT%TZ)" >> "$log"
  echo '{}'
elif [ "$loop_count" -lt 1 ]; then
  printf '%s\tstop:completed:followup\n' "$(date -u +%FT%TZ)" >> "$log"
  jq -n '{
    followup_message:
      "Completion evidence is missing or stale for the current tree. Read docs/TRACKER.md, run the task-targeted check, then bash scripts/check.sh; inspect real failures and update TRACKER. Stop if blocked or budget is exhausted."
  }'
else
  printf '%s\tstop:completed:loop-limit\n' "$(date -u +%FT%TZ)" >> "$log"
  echo '{}'
fi
