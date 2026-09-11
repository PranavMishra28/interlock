#!/usr/bin/env bash
# The one verification entrypoint. Same command locally and in CI.
#
#   npm ci && bash scripts/check.sh
#
# Runs, in order: lockfile drift, inherited `npm run verify` (typecheck of all
# workspaces, inherited tests, MCP stdio round trip), the web build, the
# pre-event scope audit, and a pin check on GitHub Actions. Needs no
# credentials and makes no paid calls. No formatter or linter is inherited;
# TypeScript strict typecheck is the static check (adding one is a lockfile
# change and therefore a reviewed decision, not a silent addition).
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NEXT_TELEMETRY_DISABLED=1 COPILOTKIT_TELEMETRY_DISABLED=true
FAILED=0
step() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
run()  { if "$@"; then printf '  \033[32m✓\033[0m %s\n' "$*"; else printf '  \033[31m✗\033[0m %s\n' "$*"; FAILED=1; fi; }

step "Lockfile — inherited package-lock.json must not drift"
run git diff --quiet --exit-code -- package.json package-lock.json

step "Inherited verify — typecheck, tests, MCP stdio"
run npm run verify

step "Web build — apps/web (selected template)"
run npm run build --workspace web

step "Scope audit — inherited sources vs recorded baseline"
run bash scripts/scope-audit.sh

step "GitHub Actions — every third-party action pinned to a full commit SHA"
uses=$(grep -rhoE '^[[:space:]]*-?[[:space:]]*uses:[[:space:]]*[^#]+' .github/workflows | sed -E 's/^[[:space:]]*-?[[:space:]]*uses:[[:space:]]*//' || true)
unpinned=$(printf '%s\n' "$uses" | sed '/^$/d' | grep -vE '@[0-9a-f]{40}[[:space:]]*$' || true)
if [ -z "$uses" ]; then printf '  \033[31m✗\033[0m no `uses:` lines found under .github/workflows (fail closed)\n'; FAILED=1
elif [ -z "$unpinned" ]; then printf '  \033[32m✓\033[0m all %s action(s) pinned\n' "$(printf '%s\n' "$uses" | sed '/^$/d' | wc -l | tr -d ' ')"
else printf '  \033[31m✗\033[0m unpinned: %s\n' "$unpinned"; FAILED=1; fi

if [ "$FAILED" = 0 ]; then printf '\n\033[1;32m✓ check.sh passed\033[0m\n'; else printf '\n\033[1;31m✗ check.sh failed\033[0m\n'; exit 1; fi
