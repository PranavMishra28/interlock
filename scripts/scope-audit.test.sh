#!/usr/bin/env bash
# Negative tests for the generic phase guard. Runs only in disposable clones.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

copy_working_controls() {
  repo=$1
  cp "$ROOT/.hackathon-phase" "$repo/.hackathon-phase"
  cp "$ROOT/scripts/scope-audit.sh" "$repo/scripts/scope-audit.sh"
  cp "$ROOT/docs/TRACKER.md" "$repo/docs/TRACKER.md"
}

expect_fail() {
  name=$1
  shift
  if "$@" >"$TMP/output" 2>&1; then
    echo "scope-audit test failed: $name unexpectedly passed" >&2
    exit 1
  fi
}

git clone -q --local --no-hardlinks "$ROOT" "$TMP/prep"
copy_working_controls "$TMP/prep"
cd "$TMP/prep"

bash scripts/scope-audit.sh >/dev/null
PHASE=BUILD_ACTIVE bash scripts/scope-audit.sh >/dev/null

cp apps/web/next.config.ts "$TMP/next.config.ts"
printf '\n// forbidden prep change\n' >> apps/web/next.config.ts
expect_fail "inherited source edit" bash scripts/scope-audit.sh
cp "$TMP/next.config.ts" apps/web/next.config.ts

touch docs/hidden.ts
expect_fail "code hidden under docs" bash scripts/scope-audit.sh
rm docs/hidden.ts

touch scripts/check.sh.bak
expect_fail "allowlist sibling" bash scripts/scope-audit.sh
rm scripts/check.sh.bak

cp scripts/scope-audit.sh "$TMP/trusted-scope-audit.sh"
cp apps/web/next.config.ts "$TMP/next.config.ts"
printf '#!/usr/bin/env bash\nexit 0\n' > scripts/scope-audit.sh
printf '\n// forbidden prep change\n' >> apps/web/next.config.ts
bash scripts/scope-audit.sh
expect_fail "self-widening PR against trusted base guard" bash "$TMP/trusted-scope-audit.sh"
cp "$ROOT/scripts/scope-audit.sh" scripts/scope-audit.sh
cp "$TMP/next.config.ts" apps/web/next.config.ts

printf 'PHASE=UNKNOWN\nAUTHORIZATION=UNRECORDED\nPREBUILD_COMMIT=UNRECORDED\n' > .hackathon-phase
expect_fail "unknown phase" bash scripts/scope-audit.sh

printf 'PHASE=BUILD_ACTIVE\nAUTHORIZATION=UNRECORDED\nPREBUILD_COMMIT=UNRECORDED\n' > .hackathon-phase
expect_fail "build without authorization" bash scripts/scope-audit.sh

git clone -q --local --no-hardlinks "$ROOT" "$TMP/build"
copy_working_controls "$TMP/build"
cd "$TMP/build"
prebuild=$(git rev-parse HEAD)
printf 'PHASE=BUILD_ACTIVE\nAUTHORIZATION=RECORDED\nPREBUILD_COMMIT=%s\n' "$prebuild" > .hackathon-phase
sed -i.bak 's/^## Status: PREP_ONLY.*/## Status: BUILD_ACTIVE/' HACKATHON_PROVENANCE.md
rm HACKATHON_PROVENANCE.md.bak
{
  printf 'Phase: BUILD_ACTIVE\n'
  printf 'Build authorization: RECORDED\n'
  printf 'Final pre-build commit: `%s`\n\n' "$prebuild"
  cat "$ROOT/docs/TRACKER.md"
} > docs/TRACKER.md
git add .hackathon-phase docs/TRACKER.md HACKATHON_PROVENANCE.md scripts/scope-audit.sh
GIT_AUTHOR_NAME="$(git log -1 --format=%an)" \
GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae)" \
GIT_COMMITTER_NAME="$(git log -1 --format=%cn)" \
GIT_COMMITTER_EMAIL="$(git log -1 --format=%ce)" \
  git commit -q -m "Test build phase transition"
bash scripts/scope-audit.sh >/dev/null

echo "scope-audit tests: PREP_ONLY, environment override, source/docs/sibling/self-widening violations, unknown phase, missing authorization, and committed BUILD_ACTIVE transition behave as expected"
