#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // ""')
phase=$(sed -n 's/^PHASE=//p' .hackathon-phase 2>/dev/null || true)
printf '%s\tcontext:%s\n' "$(date -u +%FT%TZ)" "$event" \
  >> "$(git rev-parse --git-dir)/interlock-hook-events"

case "$event" in
  sessionStart)
    jq -n --arg phase "${phase:-UNKNOWN}" '{
      additional_context:
        ("Interlock phase is " + $phase + ". Read AGENTS.md, docs/TRACKER.md, relevant docs/PLAN.md sections, and actual Git state before acting. TRACKER owns progress; Git and test evidence outrank old summaries.")
    }'
    ;;
  preCompact)
    jq -n '{
      user_message:
        "Before compaction, the lead should update docs/TRACKER.md with current task, owners, dirty paths, tests, blockers, and exact next action. Compaction itself is not blocked."
    }'
    ;;
  *)
    echo '{}'
    ;;
esac
