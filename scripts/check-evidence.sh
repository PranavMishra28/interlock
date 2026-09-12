#!/usr/bin/env bash
# Tie a successful full check to the exact current tracked/untracked tree.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
evidence="$(git rev-parse --git-dir)/interlock-last-check"

tree_id() {
  {
    git rev-parse HEAD
    git diff --binary HEAD
    while IFS= read -r -d '' file; do
      printf '%s\0' "$file"
      git hash-object "$file"
    done < <(git ls-files -z --others --exclude-standard)
  } | git hash-object --stdin
}

case "${1:-verify}" in
  record)
    # Only a completed check run may certify a tree; a bare `record` would let
    # an assertion stand in for a passing check.
    [ "${INTERLOCK_CHECK_RUN:-}" = 1 ] ||
      { echo "check-evidence: record requires a completed scripts/check.sh run" >&2; exit 2; }
    printf 'commit=%s\ntree=%s\n' "$(git rev-parse HEAD)" "$(tree_id)" > "$evidence"
    ;;
  verify)
    [ -f "$evidence" ]
    [ "$(sed -n 's/^commit=//p' "$evidence")" = "$(git rev-parse HEAD)" ]
    [ "$(sed -n 's/^tree=//p' "$evidence")" = "$(tree_id)" ]
    ;;
  current)
    tree_id
    ;;
  *)
    echo "usage: $0 [record|verify|current]" >&2
    exit 2
    ;;
esac
