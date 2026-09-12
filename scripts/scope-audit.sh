#!/usr/bin/env bash
# Phase guard and provenance report. Repository evidence only.
# TRUSTED_PHASE_GUARD_V1: PR CI also runs the base branch's copy.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

IMPORT_BASELINE=79b036635c01d932374bed1013b901283f421096
PRE_EVENT_TAG_COMMIT=76897ddd227c4d3f06e35063679e7189d075f747
PHASE_FILE=.hackathon-phase

die() { echo "scope-audit: $*" >&2; exit 1; }
value() {
  key=$1
  count=$(grep -c "^${key}=" "$PHASE_FILE" || true)
  [ "$count" = 1 ] || die "$PHASE_FILE must contain exactly one ${key}= line"
  sed -n "s/^${key}=//p" "$PHASE_FILE"
}

[ -f "$PHASE_FILE" ] || die "missing $PHASE_FILE (unknown phase fails closed)"
[ "$(wc -l < "$PHASE_FILE" | tr -d ' ')" = 3 ] ||
  die "$PHASE_FILE must contain exactly PHASE, AUTHORIZATION, PREBUILD_COMMIT"

phase=$(value PHASE)
authorization=$(value AUTHORIZATION)
prebuild=$(value PREBUILD_COMMIT)

git cat-file -e "${IMPORT_BASELINE}^{commit}" 2>/dev/null ||
  die "import baseline $IMPORT_BASELINE is unavailable (shallow clone?)"
tag_commit=$(git rev-list -n1 pre-event-baseline 2>/dev/null || true)
[ "$tag_commit" = "$PRE_EVENT_TAG_COMMIT" ] ||
  die "pre-event-baseline is missing or moved (expected $PRE_EVENT_TAG_COMMIT)"

case "$phase" in
  PREP_ONLY)
    [ "$authorization" = UNRECORDED ] && [ "$prebuild" = UNRECORDED ] ||
      die "PREP_ONLY requires AUTHORIZATION=UNRECORDED and PREBUILD_COMMIT=UNRECORDED"

    # Exact files plus prose/image docs. Broad directory prefixes would let
    # product code hide inside an allowlisted directory.
    ALLOW=(
      .hackathon-phase
      .cursor/hooks.json
      .cursor/hooks/before-shell.sh
      .cursor/hooks/context.sh
      .cursor/hooks/stop.sh
      .github/dependabot.yml
      .github/workflows/ci.yml
      .gitignore
      AGENTS.md
      CLAUDE.md
      README.md
      SECURITY.md
      SUBMISSION.md
      HACKATHON_PROVENANCE.md
      scripts/check.sh
      scripts/check-evidence.sh
      scripts/docs-links.test.mjs
      scripts/hooks.test.sh
      scripts/scope-audit.sh
      scripts/scope-audit.test.sh
    )

    changed="$( {
      git diff --name-only --no-renames "$IMPORT_BASELINE"
      git ls-files --others --exclude-standard
    } | sort -u)"
    violations=()
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      ok=0
      case "$file" in
        docs/*.md|docs/*.png|docs/*/*.md|docs/*/*.png) ok=1 ;;
      esac
      if [ "$ok" = 0 ]; then
        for allow in "${ALLOW[@]}"; do
          [ "$file" = "$allow" ] && { ok=1; break; }
        done
      fi
      [ "$ok" = 1 ] || violations+=("$file")
    done <<<"$changed"

    total=$(printf '%s\n' "$changed" | sed '/^$/d' | wc -l | tr -d ' ')
    echo "scope-audit: PREP_ONLY; import ${IMPORT_BASELINE:0:12}; ${total} changed path(s); ${#violations[@]} violation(s)"
    if [ "${#violations[@]}" -gt 0 ]; then
      printf '  ✗ %s\n' "${violations[@]}"
      die "product/inherited paths changed during PREP_ONLY"
    fi
    echo "  ✓ inherited application source and lockfile remain frozen"
    ;;

  BUILD_ACTIVE)
    [ "$authorization" = RECORDED ] ||
      die "BUILD_ACTIVE requires AUTHORIZATION=RECORDED"
    printf '%s' "$prebuild" | grep -Eq '^[0-9a-f]{40}$' ||
      die "BUILD_ACTIVE requires a full PREBUILD_COMMIT SHA"
    git cat-file -e "${prebuild}^{commit}" 2>/dev/null ||
      die "PREBUILD_COMMIT $prebuild is unavailable"
    git merge-base --is-ancestor "$prebuild" HEAD ||
      die "PREBUILD_COMMIT must be an ancestor of HEAD"
    [ "$prebuild" != "$(git rev-parse HEAD)" ] ||
      die "BUILD_ACTIVE must be recorded in a later transition commit"
    git diff --quiet HEAD -- "$PHASE_FILE" docs/TRACKER.md HACKATHON_PROVENANCE.md ||
      die "phase, tracker, and provenance transition must be committed"
    grep -qx 'Phase: BUILD_ACTIVE' docs/TRACKER.md ||
      die "TRACKER phase does not match BUILD_ACTIVE"
    grep -qx 'Build authorization: RECORDED' docs/TRACKER.md ||
      die "TRACKER does not record maintainer authorization"
    grep -qx "Final pre-build commit: \`$prebuild\`" docs/TRACKER.md ||
      die "TRACKER pre-build commit does not match $PHASE_FILE"
    grep -q '^## Status: BUILD_ACTIVE' HACKATHON_PROVENANCE.md ||
      die "provenance does not record BUILD_ACTIVE"

    echo "scope-audit: BUILD_ACTIVE; provenance changes since final pre-build commit $prebuild"
    git diff --name-status --no-renames "$prebuild"
    ;;

  *)
    die "unknown PHASE=$phase (only a committed phase file can change mode)"
    ;;
esac
