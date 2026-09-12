# Interlock execution tracker

Phase: PREP_ONLY
Build authorization: UNRECORDED
Final pre-build commit: UNRECORDED

This is the single shared status ledger. Git and test output outrank summaries.
At every phase boundary and before context compaction, the lead updates this
file with branch/HEAD, dirty paths, checks, blockers, ownership, and one exact
next action.

## Checkpoint

- Inspected branch/HEAD: `prep-audit-simplify` at `851b745` before this status
  update; base is `76897ddd227c4d3f06e35063679e7189d075f747`.
- Last checkpoint: 2026-09-12 01:37 PDT.
- Dirty paths: this tracker and provenance update only; clean after commit.
- Active writer: lead agent owns the branch and shared status.
- Read-only workers: eligibility/provenance; security/correctness;
  feasibility/demo/context continuity. They return findings only.

## Audit findings

- `docs/PLAN.md` made Trigger.dev, Firestore, an executor service, and Auth0 the
  critical path. Consequence: too many credentials/failure domains for the
  event. Fix: local coordinator + one SQLite DB + inherited web + one target;
  those services are deferred.
- `scripts/scope-audit.sh` described a manual allowlist extension but had no
  committed phase/authentication record. Consequence: an ambiguous build
  transition. Fix: `.hackathon-phase`, fail-closed parsing, final pre-build SHA,
  provenance reporting, disposable negative tests, and PR CI running the
  already-trusted base copy so a changed guard cannot certify itself.
- `.github/workflows/ci.yml` relied on prose for no privileged trigger, secrets,
  writes, or deploys. Consequence: accidental authority could enter CI. Fix:
  exact workflow allowlisting and negative-tested forbidden-pattern checks;
  full-SHA pin and read-only-token checks remain.
- `apps/channel-slack/src/channel.tsx` subscribes on mention and handles later
  messages only for subscribed threads; `tools.tsx` buttons only edit a
  message. Consequence: inherited Slack is transport/demo UI, not authenticated
  approval. Fix: P0 capability checkpoint and exact actor/revision validation;
  web is guaranteed fallback.
- `apps/web/src/components/generative-ui.tsx` has inherited anonymous,
  request-local HITL, and inherited API routes are unauthenticated. Consequence:
  neither is Interlock authority or deployable as-is. Fix: loopback-only
  verification now; replace with the shared authenticated coordinator route
  before deployment.
- `scripts/check-env.sh` sources `.env` as shell. Consequence: the file is
  executable configuration. Fix: owner-created offline file only; strict
  parsing is a BUILD_ACTIVE security prerequisite before real credentials.
- `package-lock.json` contains vulnerable transitive PostCSS, Undici, `qs`, and
  OpenTelemetry paths. Consequence: live exposure is unsafe without a reviewed
  remediation. Fix: block hosting/live traffic at P0; a compatible lock-only
  trial changed nothing and no major/override was forced.
- Inherited docs link to a root `SUBMISSION.md` that was deliberately omitted.
  Consequence: navigation broke. Fix: one thin bridge to canonical
  `docs/SUBMISSION.md`; no second checklist.
- All 75 imported blobs match pinned upstream; local/remote history contains no
  Warden naming or Interlock core. Consequence: provenance anchors remain valid;
  no rename, deletion, or repository replacement is needed.

## Read-only review integration

| Review | Path-specific result | Lead action |
|---|---|---|
| Eligibility/provenance | no core implementation; import/tag anchors valid; stale remote refs could confuse | reverified 75/75 against upstream; `git fetch --prune`; preserved the local merged branch/history |
| Security/correctness | guard could self-certify; workflow prohibitions were prose; inherited web/Slack approval and routes lack Interlock authority | trusted-base PR guard, workflow policy negative tests, explicit deployment/auth blockers, local single-owner topology |
| Feasibility/demo/context continuity | old plan would rebuild Trigger/Firestore/executor/Auth0; no tracker/runbook; Slack click only rewrites card | rewrote canonical docs for SQLite coordinator/web/one target; added TRACKER/RUNBOOK and P0–P4 prompts |

One repair loop integrated the findings. The one-time guard-migration PR cannot
retroactively use a base script that does not contain the new trusted marker;
it uses the audited PR copy. Every later PR also runs the base-branch guard.

## Invariant summary

The canonical requirements are [PLAN §3](PLAN.md#3-requirements-and-invariants).
In short: untrusted context has no authority; approval binds one exact revision
and verified operator; an active hold never releases on timeout or missing
evidence; enforcement and claims are server-side and atomic; fresh continuous
evidence is required; uncertain cloud outcomes reconcile before retry;
verification reads the intended target back; retirement retains redacted,
correlated evidence. Conflicts fail closed.

## Work

| ID | Depends on | State | Acceptance evidence / blocker |
|---|---|---|---|
| PREP-01 Reality and provenance audit | — | DONE | Clean `main` at `76897dd`; 75/75 imported blobs match upstream `2622f07`; no Warden/core code found; Slack callbacks inspected |
| PREP-02 Simplify canonical documents | PREP-01 | DONE | Lead diff review: prose + generic controls only; no `apps/**`, `packages/**`, manifest, or lockfile changes |
| PREP-03 Phase-aware guard | PREP-01 | DONE | `scope-audit.test.sh` passes source/docs/sibling/self-widening/phase/authorization cases; workflow policy negatives pass |
| PREP-04 Dependency exposure review | PREP-01 | DONE | GitHub alerts and `npm audit` inspected; compatible lock-only trial changed nothing; restrictions in READINESS |
| PREP-05 Three read-only reviews | PREP-02, PREP-03 | DONE | Findings and one repair loop recorded above |
| PREP-06 Offline/browser/context-reset verification | PREP-02..05 | DONE | `check.sh` passed in 49 s at 01:34 PDT; inherited page/browser APIs loaded with no failed resource/model call; history/source/artifact/task-log gitleaks scans found no leak; feasibility fresh-context review exposed and drove the tracker/runbook/topology fixes |
| PREP-07 PR, CI, merge, remote read-back | PREP-06 | IN_PROGRESS | [PR #3](https://github.com/PranavMishra28/interlock/pull/3) open; requires green `verify`, merged SHA, protected-setting read-back, clean local status |
| P0 Official opening and deliberate transition | PREP-07 | BLOCKED | Requires official opening plus explicit maintainer authorization and budget |
| P1 Deterministic vertical slice | P0 | BLOCKED | See RUNBOOK; real target response required for live-complete |
| P2 Contextual agency | P1 | BLOCKED | See RUNBOOK; context-removal and authority cases required |
| P3 Reliability | P2 | BLOCKED | See RUNBOOK; critical invariant failures block features |
| P4 Demo and submission preparation | P3 | BLOCKED | Human authorization required to publish or submit |

States: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`. `DONE` requires a command,
test, URL, commit, or other observed result—not generated code or a checkbox.

## Current blockers

- The official build has not been explicitly authorized by the maintainer.
- Eligibility of custom pre-event integrations is not stated; none are made.
- Personal OpenAI key/credit entitlement, personal GCP project/budget, and
  personal Slack app/workspace access are not live-verified.
- Inherited runtime dependencies have unresolved advisories; do not host the
  starter until the build-day remediation gate in READINESS passes.

## Exact next action

Lead: push this status commit, require green `verify` on PR #3, then merge,
enable admin enforcement for `verify`, and read back HEAD/settings.

## Resume protocol

Read `AGENTS.md`, this file, relevant `PLAN.md` sections, then run
`git status --short --branch`, `git log -1 --format=%H`, and
`bash scripts/scope-audit.sh`. Do not use an old assistant summary as authority.
