#!/usr/bin/env bash
# Pre-event scope audit (repository evidence only).
#
# Inherited starter sources must still be byte-identical to the recorded
# baseline commit, and every other tracked or untracked change must sit inside
# the bootstrap allowlist below. This proves what is in the repository; it
# proves nothing about work outside it.
#
# During the official build period: extend ALLOW (or replace this check with a
# report) in the same commit that starts event work, so the diff is explicit.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Commit that imported CopilotKit/agents-everywhere-starter-kit@2622f07d17850ad68bb9a7266c566c1fefc97df4
# as a verbatim subset. See HACKATHON_PROVENANCE.md.
BASELINE=79b036635c01d932374bed1013b901283f421096

# Bootstrap-only paths allowed to differ from the baseline before the event.
ALLOW=(
  .github/
  .gitignore
  AGENTS.md
  CLAUDE.md
  README.md
  SECURITY.md
  HACKATHON_PROVENANCE.md
  docs/
  scripts/check.sh
  scripts/scope-audit.sh
)

if ! git cat-file -e "${BASELINE}^{commit}" 2>/dev/null; then
  echo "scope-audit: baseline commit ${BASELINE} is not in this clone (shallow fetch?)." >&2
  exit 1
fi

# Tracked changes (committed or not) against the baseline, plus untracked files.
# --no-renames: a rename of an inherited file into an allowlisted dir must
# still show the inherited path as deleted.
changed="$( { git diff --name-only --no-renames "$BASELINE"; git ls-files --others --exclude-standard; } | sort -u)"

violations=()
while IFS= read -r path; do
  [ -z "$path" ] && continue
  ok=0
  for allow in "${ALLOW[@]}"; do
    case "$allow" in
      */) case "$path" in "$allow"*) ok=1 ;; esac ;;   # directory prefix
      *)  [ "$path" = "$allow" ] && ok=1 ;;            # exact file
    esac
    [ "$ok" = 1 ] && break
  done
  [ "$ok" = 1 ] || violations+=("$path")
done <<<"$changed"

# docs/ is allowlisted for prose and labeled screenshots only; code hidden
# there is still code.
while IFS= read -r path; do
  [ -n "$path" ] && violations+=("$path (non-prose file under docs/)")
done < <(git ls-files --cached --others --exclude-standard -- docs | grep -vE '\.(md|png)$' || true)

total=$(printf '%s\n' "$changed" | sed '/^$/d' | wc -l | tr -d ' ')
echo "scope-audit: baseline ${BASELINE:0:12}, ${total} path(s) differ, ${#violations[@]} outside allowlist"

if [ "${#violations[@]}" -gt 0 ]; then
  printf '  ✗ %s\n' "${violations[@]}"
  echo "scope-audit: inherited sources changed outside the bootstrap allowlist (PREP_ONLY)." >&2
  exit 1
fi
echo "  ✓ inherited starter sources match the recorded baseline"
