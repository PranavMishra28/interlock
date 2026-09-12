# Interlock execution tracker

Phase: BUILD_ACTIVE
Build authorization: RECORDED
Final pre-build commit: `88b6309b071978fb2ec585b683392a11d5283358`

This is the only progress ledger. Git state and observed command results outrank
assistant summaries. The lead updates this checkpoint at phase boundaries and
before compaction.

## Checkpoint

- Inspected base: clean `main` at
  `88b6309b071978fb2ec585b683392a11d5283358` (PR #6 merge).
- Working branch: `build-active`.
- Last checkpoint: 2026-09-12 GCP Always Free budget recorded; live coordinator
  loop and Slack restart-safe approval still unimplemented.
- Authorization evidence: the maintainer confirmed the official build opening
  and authorized BUILD_ACTIVE in this session. Scope is the PLAN MVP and
  personal accounts only. GCP spend is recorded as **$0 Always Free** (see
  READINESS). OpenAI API credits/budget are still unrecorded. Slack install and
  a dedicated personal GCP project remain ACCESS_REQUIRED.
- Dirty ownership: lead owns TRACKER/integration; no second writer is active.
- Last verified: `bash scripts/check.sh` passed on the current working tree:
  inherited typecheck/tests/MCP stdio, web build, phase guard negatives, hook
  fixtures, canonical doc links, workflow policy and action pins. Inherited web
  smoke rendered locally with no model call; gitleaks found no leak in history,
  changed paths, or the private guide. `main`'s guard was re-run against this
  branch in a clean clone and reported 0 violations. Three bounded read-only
  reviews (eligibility/provenance, security/harness, feasibility/design) found
  no Interlock core implementation; their findings were repaired in one pass.
  PR #5 (guard allowlist) merged with green `verify`; PR #6 carries the rest.
- BUILD_ACTIVE evidence: transition `dc42655:99fb15e`; deterministic slice
  `bfbcbc4:d24b0f6`. `bash scripts/check.sh` passed on the exact pre-commit
  slice tree (`dc42655:d813a9b`), including 5 core tests, 3 intent tests, 6
  coordinator/store tests, all inherited checks, web build, and repaired
  phase-guard fixtures. A loopback-only browser preview rendered the visibly
  synthetic Control Room with no model call.
- Offline integration evidence: `87fe0b8:ec7befb`; the full check passed on its
  exact pre-commit tree (`bfbcbc4:fd8b187`). Tests cover ambient unmentioned
  top-level/reply normalization, bot/channel/edit/delivery filtering, bounded
  source retention, owner/revision approval rejection, conflicting proposals,
  duplicate claims, restart/uncertain effects, and direct Cloud Run v2 request
  and read-back shape. Browser inspection covered intervention and empty states,
  800px layout without horizontal overflow, reduced motion, one H1, chart text
  alternative, and the synthetic label. Inherited paid/search routes are
  disabled and the voice page redirects to the Control Room.
- Current completion evidence: release-targeted agent-core (8), Slack (13), and
  web/coordinator/adapter (25) tests plus the production web build passed at
  clean checkpoint `bdf7ca0`. The subsequent full `bash scripts/check.sh`
  passed and recorded `bdf7ca0:8a6ab7a`, including all workspace typechecks,
  tests, MCP stdio, web build, phase negatives, hooks, docs, and workflow
  policy. No external account, paid call, or deployment was used.
- Security review follow-up: all six actionable P1 findings were repaired at
  `d2b4a64:e11b258646863627d62eae056fd88344eb8070d2`. Slack HTTP is loopback
  only; `.env` is parsed as inert data; Cloud Run requests have exact HTTPS,
  redirect, timeout and size bounds; listener status comes from a
  workspace/channel-bound online heartbeat; coordinator failure exposes no
  synthetic workflow/evidence; and Slack ingress plus approval require the
  configured workspace identity. The targeted 74-test repair gate, workspace
  typechecks, and subsequent full `bash scripts/check.sh` passed on that clean
  checkpoint.
- Invariant correctness follow-up: the nine P1 findings from the review of the
  earlier integration tree were rechecked against the current tree and repaired
  at `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477`. Unresolved dispatches
  retain one operation identity and only re-read after error/restart; wrong
  revision/routing remains visible; expired proposals release the resource;
  duplicate timestamps durably reset the evidence window; a SQLite-exclusive
  owner lock replaces PID-file stale-lock recovery; proposal cards are created
  from attributed ambient messages and bind workspace, resource, revision and
  a server-issued card capability before approval. Targeted state, store,
  coordinator, Slack and Cloud tests plus the subsequent full
  `bash scripts/check.sh` passed on that clean checkpoint.
- Offline completion audit: the structured intervention fixture now carries
  the same wrong-revision evidence as its notice at
  `ca2dc7c:c556474499785fda6be83ac2a1d01f2d6d469a74`. Its production build and
  focused tests passed; a loopback-only browser render showed observed `v41`,
  effective routing `100%`, one H1, no horizontal overflow, and the explicit
  synthetic label. The subsequent full `bash scripts/check.sh` passed on that
  clean checkpoint. CORE-1, COORD-1, UI-1, and REL-1 are complete; no eligible
  offline work remains before the capability-gated live nodes.
- Blockers: dedicated personal GCP project still missing (`prod-457713` is
  not usable). Slack channel install missing. OpenAI budget unrecorded.
  Coordinator process does not yet observe/enforce/continue. Approval cards
  do not survive listener restart. Inherited dependency exposure still blocks
  public hosting.
- Exact next action: keep wiring the coordinator observer/promote loop and
  restart-safe Slack approvals offline; wait for a dedicated personal
  `us-central1` project the Gmail identity can describe.

## Invariant summary

The immutable requirements are [PLAN §3](PLAN.md#3-requirements-and-invariants):
untrusted context has no authority; trusted configuration selects the resource
owner; explicit approval binds one revision; active holds fail closed; elapsed
fresh evidence resets on gaps/flapping/restart; one server adapter enforces and
deduplicates; uncertain effects reconcile; target-specific read-back decides the
outcome; retirement retains redacted correlated evidence. See PLAN for the
normative wording.

## Capability status

| ID | Capability | Status | Evidence / unlock |
|---|---|---|---|
| CAP-LOCAL | Node/npm/Git, inherited workspaces, loopback development | OFFLINE_READY | READINESS versions; `bash scripts/check.sh` |
| CAP-HARNESS | Project hooks and resume path | OFFLINE_READY | hook fixtures pass; current IDE shell hook observed; fresh-session context check pending |
| CAP-SLACK | Personal Slack workspace/app and ambient channel delivery | ACCESS_REQUIRED | owner installs after P0; new unmentioned top-level + reply test |
| CAP-MODEL | Personal OpenAI project/key and agreed API budget | KEY_REQUIRED | one bounded post-P0 behavior/cost check |
| CAP-GCP | Dedicated personal GCP project, budget, target and execution identity | ACCESS_REQUIRED | $0 Always Free recorded; dedicated project + named config still required |

Statuses: `OFFLINE_READY`, `KEY_REQUIRED`, `ACCESS_REQUIRED`,
`LIVE_VERIFIED`, `DEFERRED`.

## Dependency DAG

`Implementation` and `Live` are separate. `DONE_IMPL` means current-tree tests
passed; it never implies an account-dependent path worked. `LIVE_VERIFIED`
requires an observed external result. Acceptance text is immutable: a fallback
may be useful but cannot make the original criterion green.

| Task | Depends on | Write owner | Prerequisite capabilities | Immutable acceptance | Allowed verification | Evidence identity | Implementation | Live |
|---|---|---|---|---|---|---|---|---|
| P0-TRANSITION | — | lead only | organizer opening + explicit maintainer scope/budget | record opening evidence, authorization, final PREP_ONLY SHA; then commit `.hackathon-phase`, TRACKER, and provenance transition before probes or product work | `bash scripts/scope-audit.sh` | `dc42655:99fb15e` | DONE_IMPL | N/A |
| CORE-1 | P0-TRANSITION | writer A | CAP-LOCAL | exact-revision contract, trusted owner/resource binding, persistence, hold/refusal, elapsed evidence, claim, retirement and retained receipt pass deterministic tests with labeled fixtures | task-owned contract/state/persistence tests, then `bash scripts/check.sh` | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | NOT_REQUIRED |
| COORD-1 | CORE-1 | writer A | CAP-LOCAL | one long-lived coordinator owns SQLite; second-owner/restart/gap behavior and loopback API are proved; browser never opens DB | coordinator integration and restart tests | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | NOT_REQUIRED |
| UI-1 | CORE-1 | writer B | CAP-LOCAL | DESIGN Control Room renders real API data or visibly labeled fixtures; accessibility, stale/error/empty/gap/failure states pass browser and visual review | web tests/build, then bounded Playwright/visual checks | `ca2dc7c:c556474499785fda6be83ac2a1d01f2d6d469a74` | DONE_IMPL | NOT_REQUIRED |
| REL-1 | COORD-1 | writer A | CAP-LOCAL | flapping/stale/restart resets, revision races, duplicate claims, uncertain dispatch reconciliation and wrong-revision failure remain fail-closed | reliability tests and one process-restart run | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | NOT_REQUIRED |
| SLACK-1 | CORE-1, COORD-1 | writer A, not concurrent with shared contract edits | CAP-SLACK only for live column | one authorized channel accepts a new unmentioned top-level event and unmentioned reply; preserves provenance/edits; suppresses duplicates/bots; persists owner binding so restart rebuilds it; routes explicit revision button to configured owner and rejects other actors | Slack unit tests; one bounded live capability script/runbook check | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | ACCESS_REQUIRED |
| MODEL-1 | CORE-1 | writer A | CAP-MODEL only for live column | bounded attributed context yields proposal or abstention; negation, ambiguity, unsupported condition, injection and context-removal cases fail safely; model has no write authority | deterministic eval set; one bounded live model check | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | KEY_REQUIRED |
| CLOUD-1 | COORD-1 | writer A | CAP-GCP only for live column | real adapter refuses held promotion; persists identity before dispatch; reconciles uncertainty; promotes only approved event-created revision; reads revision/routing/fresh health back | adapter contract tests; one bounded personal-target smoke | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | ACCESS_REQUIRED |
| RELEASE-1 | UI-1, REL-1, SLACK-1, MODEL-1, CLOUD-1 | lead | CAP-SLACK + CAP-MODEL + CAP-GCP LIVE_VERIFIED | end-to-end ambient decision → owner approval → refused operation → reset/recovery → one continuation → target receipt; dependency/security gate cleared | progressive gates in RUNBOOK, then `bash scripts/check.sh` | — | BLOCKED_DEPS | BLOCKED_DEPS |
| DEMO-1 | RELEASE-1 | lead | portal deadline confirmed | ≤120-second truthful rehearsal; shortened/synthetic/local behavior labeled; clean-clone, secrets, provenance, reset and cleanup checks pass; publication remains human-only | RUNBOOK demo/submission gate | — | BLOCKED_DEPS | BLOCKED_DEPS |

Task states: `TODO`, `IN_PROGRESS`, `BLOCKED_PHASE`, `BLOCKED_CAPABILITY`,
`BLOCKED_DEPS`, `DONE_IMPL`, `LIVE_VERIFIED`, `N/A`. A done cell requires a
command/result and evidence identity formatted as `<commit>:<tree-id>` (or a
redacted external receipt linked to that identity), not a checkbox.

## Scheduling and ownership rules

- Recover context → choose an eligible DAG node → implement → run its allowed
  targeted check → inspect failures → repair within the recorded retry/time/API
  budget → checkpoint here → continue.
- One lead owns integration, shared contracts, manifests/lockfile, PLAN, and
  TRACKER. At most two isolated writers may work concurrently, only on disjoint
  paths. Reviewers are read-only.
- Missing keys receive one concise notice. Continue eligible offline nodes and
  recheck only the approved configuration location at bounded checkpoints; do
  not poll private directories or print credentials.
- Stop on user interruption, exhausted budget, no measured progress within the
  retry limit, or a real permission/eligibility blocker. Never relax a guard or
  acceptance requirement to continue.

## Resume protocol

Read `AGENTS.md`, this file, relevant PLAN sections, and actual Git
status/log. Run `bash scripts/scope-audit.sh`. State phase, branch/HEAD, dirty
paths, eligible task, owner, last current-tree evidence, blockers, and exact next
action. Cursor hooks provide reminders only; reopen the chat or use the
documented `cursor-agent --resume/--continue` path after a stopped process.
