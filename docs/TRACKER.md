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
- Last checkpoint: 2026-09-12 economical model and managed-channel
  configuration. The configured personal OpenAI project exposes the pinned
  `gpt-5.4-mini-2026-03-17` snapshot; runtime fallback, preflight, and
  `.env.example` agree. CopilotKit project `interlock` is bound and its Slack
  channel record is committed without credentials; Slack OAuth remains
  ACCESS_REQUIRED.
- Authorization evidence: the maintainer confirmed the official build opening
  and authorized BUILD_ACTIVE in this session. Scope is the PLAN MVP and
  personal accounts only. GCP spend is recorded as **$0 Always Free** and
  OpenAI has a **$100 USD hard event cap** with spend minimization required
  (see READINESS). Slack installation remains ACCESS_REQUIRED.
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
- Current completion evidence: `bash scripts/check.sh` passed on the clean
  committed tree `5873d84:5a63d1fc2fea6d2ba3a1c894070cc332dbf005fa`, including
  the 59-test inherited verify (env preflight, secret-safe doctor, MCP stdio),
  all workspace typechecks, the web build, phase-guard negatives, hook
  fixtures, canonical doc links, workflow policy, and action pins. No external
  account, paid call, or deployment was used.
- Model/channel checkpoint: targeted agent-core intent/state and environment
  checks passed (59 tests), followed by agent-core typecheck and canonical
  documentation links. Full `bash scripts/check.sh` then passed on the clean
  committed tree `cd8e4ff:8694e55177135b76a534c24444a31e1fbef6059b`. The only
  OpenAI request was a model-list read (no generation);
  `gpt-5.4-mini-2026-03-17` was present. No model spend was incurred.
- Slack credential incident 2026-09-12: a bot token and an app-level token were
  pasted into the assistant transcript and are therefore compromised. Neither
  was used, stored, or written to any file; a working-tree and history scan
  found only inherited documentation that mentions the `xapp-` prefix, no token
  values. Both must be revoked and the bot token rotated by reinstalling the
  app before CAP-SLACK can proceed. The managed Channel path needs a bot token
  and signing secret only; it never uses an app-level token or Socket Mode.
- Live-gap audit correction: the coordinator process is HTTP + SQLite only. It
  never observes health, never refuses a real promotion attempt, never
  constructs `CloudRunAdapter`, and never continues autonomously; `observe`,
  `requestPromotion`, and `continue` are called only from tests. Slack approval
  cards are posted as pre-rendered IR, so a listener restart cannot rebuild the
  button. SLACK-1 and CLOUD-1 `DONE_IMPL` therefore overstate the process; the
  library functions pass their own tests but are not wired into the long-lived
  process.
- Live-gap repair at `a78ea06`: a supervisor now drives the hold from the
  long-lived coordinator process. It reads the target, records the sample, and
  continues once the window elapses, refusing overlapping ticks so one workflow
  cannot be claimed twice. `start()` constructs `CloudRunAdapter` from the
  environment, `/v1/promote` exposes the refusal surface, and Google tokens come
  from Application Default Credentials with `quota_project_id` ignored so quota
  attributes to the project owning the service. Slack approvals are posted with
  `postRegisteredComponent`, so a listener restart re-renders the card and
  rebuilds its handler; a runtime without that capability is refused rather than
  silently downgraded.
- Clock calibration: measured against the live target, the Cloud Run container's
  clock runs up to +117ms ahead of the workstation. The domain treated any
  future-dated sample as an untrustworthy clock, so roughly every other live
  sample reset the window and a healthy hold could never close. `observe` and
  `verify` now allow a bounded 2s skew, deliberately as a module constant rather
  than a contract field, so no proposer can widen the tolerance that decides
  whether a target's clock is trusted.
- CLOUD-1 live evidence 2026-09-12 against `checkout` in `interlock-508417`
  (`us-central1`), driven by `apps/web/src/server/live-check.ts`:
  - Refusal: starting from `checkout-v41` at 100% with the health endpoint
    faulted to 0.9 against a 0.5 threshold, the hold recorded 25 resets across
    ~35s and traffic never moved.
  - Recovery and closure: after the fault was cleared the window opened, held
    16s clean, claimed exactly one operation, promoted, and the independent
    read-back returned expected `checkout-v42`, observed `checkout-v42`, routing
    100%, health 0.1.
  - A prior clean run closed a 14.9s window with 0 resets. The fault switch
    refuses an unauthenticated caller with 403. The target was reset to
    `checkout-v41` afterwards, so the demonstration is repeatable.
- MODEL-1 live evidence 2026-09-12 via `packages/agent-core/src/live-eval.ts`
  against `gpt-5.4-mini-2026-03-17`: 9/9 on three consecutive runs at roughly
  $0.005 per run. The set covers an explicit current decision, hypothetical,
  negation, missing parameters, unknown resource, unsupported condition family,
  prompt injection, a forged owner approval, and a real decision buried in
  ordinary incident chatter, which guards against a model that abstains from
  everything and is therefore useless.
  - Two findings were recorded rather than smoothed over. The forged-approval
    case is genuinely unstable between runs, so it asserts the guarantee that
    actually holds: the output shape cannot express approval and any proposal
    stays bound to the trusted resource, because authority belongs to the
    coordinator and the owner's server-signed card. Separately, without
    OpenAI strict structured output the model intermittently returned an object
    with no `kind`; that failed safe, producing no proposal, and strict mode
    with a pruned nullable union removed it.
- Cumulative OpenAI spend this event is approximately $0.03 against the $100
  cap: a free model-list read plus six eval runs.
- Current-tree verification 2026-09-12: the UI-1 targeted gate
  (`npm run typecheck --workspace web`, 40 web tests, and the production web
  build) passed at clean committed checkpoint
  `01b437b:b4f02998c07eac48cafc762acb8c21c607c9cb63`. The subsequent
  `bash scripts/check.sh` passed on the same tree, including all workspace
  typechecks and tests, MCP stdio, production web build, scope/phase negatives,
  hook fixtures, canonical documentation links, workflow policy, and action
  pins. No paid API call or external mutation was made by this verification.
- Live GCP evidence: dedicated personal project `interlock-508417` provisioned
  in `us-central1` inside the $0 Always Free envelope, isolated in the named
  gcloud configuration `interlock`. `checkout-v41` serves 100%; candidate
  `checkout-v42` exists at 0% traffic. `GET /health` returns the exact
  `{value, observedAt}` contract the adapter requires; an unauthenticated
  `POST /fault` is refused with 403 while a tokened call genuinely degrades
  health to 0.9 and recovers to 0.1. The teardown ledger is in READINESS.
- Blockers: CAP-SLACK remains ACCESS_REQUIRED. The previously pasted bot and
  app-level tokens are compromised and may not be recovered or reused; the
  managed Channel needs a freshly issued bot token plus the Slack signing
  secret and configured workspace/channel/owner IDs. Inherited dependency
  exposure still blocks public hosting, but the reviewed loopback-only
  READINESS amendment permits the bounded local Slack/OpenAI/Cloud Run demo.
- Exact next action: after the maintainer places the fresh Slack bot token,
  signing secret, workspace ID, channel ID, and owner ID directly in ignored
  `.env`, attach the existing `interlock` managed Channel, run the bounded live
  top-level/reply/approval/restart checks, and complete RELEASE-1. Until that
  external install exists, continue eligible UI/rehearsal/repository gates
  without representing synthetic evidence as live.

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
| CAP-MODEL | Personal OpenAI project/key and agreed API budget | LIVE_VERIFIED | `gpt-5.4-mini-2026-03-17`; 9/9 bounded live eval on three consecutive runs; approximately $0.03 cumulative event spend against $100 cap |
| CAP-GCP | Dedicated personal GCP project, budget, target and execution identity | LIVE_VERIFIED | `interlock-508417`/`us-central1`; `checkout-v41` serving 100%, `checkout-v42` at 0%; health 0.1/0.9/0.1 observed; unauthenticated fault refused 403 |

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
| SLACK-1 | CORE-1, COORD-1 | writer A, not concurrent with shared contract edits | CAP-SLACK only for live column | one authorized channel accepts a new unmentioned top-level event and unmentioned reply; preserves provenance/edits; suppresses duplicates/bots; persists owner binding so restart rebuilds it; routes explicit revision button to configured owner and rejects other actors | Slack unit tests; one bounded live capability script/runbook check | `a78ea06` | DONE_IMPL (restart-safe registered approval) | ACCESS_REQUIRED |
| MODEL-1 | CORE-1 | writer A | CAP-MODEL only for live column | bounded attributed context yields proposal or abstention; negation, ambiguity, unsupported condition, injection and context-removal cases fail safely; model has no write authority | deterministic eval set; one bounded live model check | `0c784c9` | DONE_IMPL | LIVE_VERIFIED |
| CLOUD-1 | COORD-1 | writer A | CAP-GCP only for live column | real adapter refuses held promotion; persists identity before dispatch; reconciles uncertainty; promotes only approved event-created revision; reads revision/routing/fresh health back | adapter contract tests; one bounded personal-target smoke | `a78ea06` | DONE_IMPL | LIVE_VERIFIED |
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
