#!/usr/bin/env bash
# Direct fixture tests for project hooks; no dangerous command is executed.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

event() {
  jq -nc --arg name "$1" --arg command "${2:-}" \
    '{hook_event_name:$name, command:$command, status:"completed", loop_count:0}'
}

session=$(event sessionStart | "$ROOT/.cursor/hooks/context.sh")
[ "$(printf '%s' "$session" | jq -r '.additional_context' | grep -c 'docs/TRACKER.md')" = 1 ]
compact=$(event preCompact | "$ROOT/.cursor/hooks/context.sh")
[ "$(printf '%s' "$compact" | jq -r '.user_message' | grep -ci 'before compaction')" = 1 ]

for command in "git reset --hard HEAD" "git push --force origin main" "git push origin +main" \
  "/usr/bin/git reset --hard" "git -c core.pager=cat reset --hard" "git add -f .env" \
  "git tag -f pre-event-baseline HEAD" "git rebase main" "git commit --amend" \
  "git config --global user.name x" "gh pr merge 5 --admin" "set -x" "set -o xtrace"; do
  result=$(event beforeShellExecution "$command" | "$ROOT/.cursor/hooks/before-shell.sh")
  [ "$(printf '%s' "$result" | jq -r '.permission')" = deny ]
done
for command in "rm -rf /tmp/example" "rm -fr /tmp/example" "rm --recursive --force /tmp/example" \
  "gcloud run deploy example" "npm publish"; do
  result=$(event beforeShellExecution "$command" | "$ROOT/.cursor/hooks/before-shell.sh")
  [ "$(printf '%s' "$result" | jq -r '.permission')" = ask ]
done
result=$(event beforeShellExecution "npm test" | "$ROOT/.cursor/hooks/before-shell.sh")
[ "$(printf '%s' "$result" | jq -r '.permission')" = allow ]

# The event log records decisions for audit, never the command text itself.
log="$(git rev-parse --git-dir)/interlock-hook-events"
[ "$(grep -c 'beforeShellExecution' "$log")" -ge 1 ]
if grep -q 'rm -rf\|--global' "$log"; then
  echo "hook test failed: event log retained command text" >&2
  exit 1
fi

git clone -q --local --no-hardlinks "$ROOT" "$TMP/repo"
mkdir -p "$TMP/repo/.cursor/hooks"
cp "$ROOT/.cursor/hooks/"*.sh "$TMP/repo/.cursor/hooks/"
cp "$ROOT/scripts/check-evidence.sh" "$TMP/repo/scripts/check-evidence.sh"
cd "$TMP/repo"

missing=$(event stop | .cursor/hooks/stop.sh)
[ "$(printf '%s' "$missing" | jq -r 'has("followup_message")')" = true ]
limited=$(jq -nc '{hook_event_name:"stop",status:"completed",loop_count:1}' | .cursor/hooks/stop.sh)
[ "$limited" = '{}' ]
aborted=$(jq -nc '{hook_event_name:"stop",status:"aborted",loop_count:0}' | .cursor/hooks/stop.sh)
[ "$aborted" = '{}' ]

if bash scripts/check-evidence.sh record 2>/dev/null; then
  echo "hook test failed: evidence recorded without a completed check run" >&2
  exit 1
fi
INTERLOCK_CHECK_RUN=1 bash scripts/check-evidence.sh record
bash scripts/check-evidence.sh verify
current=$(event stop | .cursor/hooks/stop.sh)
[ "$current" = '{}' ]
touch progress-note
if bash scripts/check-evidence.sh verify; then
  echo "hook test failed: changed tree retained stale completion evidence" >&2
  exit 1
fi
stale=$(event stop | .cursor/hooks/stop.sh)
[ "$(printf '%s' "$stale" | jq -r 'has("followup_message")')" = true ]

echo "hook tests: context, compaction notice, deny/ask/allow, loop cap, interruption, and tree-bound completion evidence behave as expected"
