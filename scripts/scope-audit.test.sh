#!/usr/bin/env bash
# Negative tests for the generic phase guard. Runs only in disposable clones.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

PREBUILD=$(awk -F= '$1 == "PREBUILD_COMMIT" { print $2 }' "$ROOT/.hackathon-phase")
printf '%s' "$PREBUILD" | grep -Eq '^[0-9a-f]{40}$' ||
  { echo "scope-audit test requires a recorded PREBUILD_COMMIT" >&2; exit 1; }

expect_fail() {
  name=$1
  shift
  if "$@" >"$TMP/output" 2>&1; then
    echo "scope-audit test failed: $name unexpectedly passed" >&2
    exit 1
  fi
}

git clone -q --local --no-hardlinks "$ROOT" "$TMP/prep"
cd "$TMP/prep"
git checkout -q "$PREBUILD"
cp "$ROOT/scripts/scope-audit.sh" scripts/scope-audit.sh

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

printf 'apps/hidden-product.ts\n' >> .gitignore
touch apps/hidden-product.ts
expect_fail "product hidden behind an ignore rule" bash scripts/scope-audit.sh
rm apps/hidden-product.ts
git checkout -- .gitignore
mkdir -p apps/web/.next
touch apps/web/.next/build-artifact.js
bash scripts/scope-audit.sh >/dev/null
rm -r apps/web/.next

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
cd "$TMP/build"
git checkout -q "$PREBUILD"
cp "$ROOT/scripts/scope-audit.sh" scripts/scope-audit.sh
prebuild=$(git rev-parse HEAD)
printf 'PHASE=BUILD_ACTIVE\nAUTHORIZATION=RECORDED\nPREBUILD_COMMIT=%s\n' "$prebuild" > .hackathon-phase
replace_line() {
  file=$1
  old=$2
  new=$3
  awk -v old="$old" -v new="$new" '$0 == old { $0 = new } { print }' "$file" > "$file.tmp"
  mv "$file.tmp" "$file"
}
replace_line docs/TRACKER.md 'Phase: PREP_ONLY' 'Phase: BUILD_ACTIVE'
replace_line docs/TRACKER.md 'Build authorization: UNRECORDED' 'Build authorization: RECORDED'
replace_line docs/TRACKER.md 'Final pre-build commit: UNRECORDED' "Final pre-build commit: \`$prebuild\`"
replace_line HACKATHON_PROVENANCE.md '## Status: PREP_ONLY' '## Status: BUILD_ACTIVE'
replace_line HACKATHON_PROVENANCE.md 'Build authorization: UNRECORDED' 'Build authorization: RECORDED'
replace_line HACKATHON_PROVENANCE.md 'Final pre-build commit: UNRECORDED' "Final pre-build commit: \`$prebuild\`"
git add .hackathon-phase docs/TRACKER.md HACKATHON_PROVENANCE.md scripts/scope-audit.sh
GIT_AUTHOR_NAME="$(git log -1 --format=%an)" \
GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae)" \
GIT_COMMITTER_NAME="$(git log -1 --format=%cn)" \
GIT_COMMITTER_EMAIL="$(git log -1 --format=%ce)" \
  git commit -q -m "Test build phase transition"
bash scripts/scope-audit.sh >/dev/null

printf '\n- ordinary progress note\n' >> docs/TRACKER.md
printf '\n- ordinary provenance note\n' >> HACKATHON_PROVENANCE.md
bash scripts/scope-audit.sh >/dev/null

replace_line docs/TRACKER.md 'Build authorization: RECORDED' 'Build authorization: TAMPERED'
expect_fail "working tracker authorization tamper" bash scripts/scope-audit.sh
replace_line docs/TRACKER.md 'Build authorization: TAMPERED' 'Build authorization: RECORDED'

replace_line docs/TRACKER.md "Final pre-build commit: \`$prebuild\`" 'Final pre-build commit: `0000000000000000000000000000000000000000`'
expect_fail "working tracker baseline tamper" bash scripts/scope-audit.sh
replace_line docs/TRACKER.md 'Final pre-build commit: `0000000000000000000000000000000000000000`' "Final pre-build commit: \`$prebuild\`"

replace_line HACKATHON_PROVENANCE.md 'Build authorization: RECORDED' 'Build authorization: TAMPERED'
expect_fail "working provenance authorization tamper" bash scripts/scope-audit.sh
replace_line HACKATHON_PROVENANCE.md 'Build authorization: TAMPERED' 'Build authorization: RECORDED'

cp .hackathon-phase "$TMP/phase"
printf '\n' >> .hackathon-phase
expect_fail "dirty phase transition" bash scripts/scope-audit.sh
cp "$TMP/phase" .hackathon-phase

older=$(git rev-parse HEAD~2)
printf 'PHASE=BUILD_ACTIVE\nAUTHORIZATION=RECORDED\nPREBUILD_COMMIT=%s\n' "$older" > .hackathon-phase
replace_line docs/TRACKER.md "Final pre-build commit: \`$prebuild\`" "Final pre-build commit: \`$older\`"
replace_line HACKATHON_PROVENANCE.md "Final pre-build commit: \`$prebuild\`" "Final pre-build commit: \`$older\`"
expect_fail "retargeted pre-build boundary" bash scripts/scope-audit.sh
printf 'PHASE=BUILD_ACTIVE\nAUTHORIZATION=RECORDED\nPREBUILD_COMMIT=%s\n' "$prebuild" > .hackathon-phase
replace_line docs/TRACKER.md "Final pre-build commit: \`$older\`" "Final pre-build commit: \`$prebuild\`"
replace_line HACKATHON_PROVENANCE.md "Final pre-build commit: \`$older\`" "Final pre-build commit: \`$prebuild\`"

replace_line docs/TRACKER.md "Final pre-build commit: \`$prebuild\`" 'Final pre-build commit: `1111111111111111111111111111111111111111`'
git add docs/TRACKER.md HACKATHON_PROVENANCE.md
GIT_AUTHOR_NAME="$(git log -1 --format=%an)" \
GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae)" \
GIT_COMMITTER_NAME="$(git log -1 --format=%cn)" \
GIT_COMMITTER_EMAIL="$(git log -1 --format=%ce)" \
  git commit -q -m "Test rejected baseline tamper"
expect_fail "committed tracker baseline tamper" bash scripts/scope-audit.sh

echo "scope-audit tests: PREP_ONLY, source/docs/sibling/ignored-path/self-widening violations, fail-closed phase and authorization, committed transition, editable BUILD_ACTIVE progress, boundary retargeting, and immutable-field tampering behave as expected"
