# Interlock build-day runbook

This is the one build-day entrypoint, not authorization. Remain PREP_ONLY until
the organizer has opened building and the maintainer explicitly authorizes the
recorded personal-account scope and budget. Check the live portal for the actual
opening and deadline.

## Arrival and deliberate transition

1. Read `AGENTS.md`, `docs/TRACKER.md`, relevant `docs/PLAN.md` sections,
   `docs/DESIGN.md`, `docs/READINESS.md`, and actual Git status/log.
2. Confirm the official opening from the organizer/portal and obtain explicit
   maintainer authorization for BUILD_ACTIVE, personal accounts, and budget.
3. Record that evidence and create the final clean PREP_ONLY commit. Its full
   SHA is the immutable `PREBUILD_COMMIT`.
4. In a later commit, set `.hackathon-phase` to `BUILD_ACTIVE`,
   `AUTHORIZATION=RECORDED`, and that SHA. Update the three protected TRACKER
   fields and matching provenance fields. Run `bash scripts/scope-audit.sh`.
5. Only after that committed transition, run custom Slack/model/cloud capability
   probes or product work. Missing credentials do not block eligible offline
   DAG nodes.

Copyable kickoff:

```text
Official build opening confirmed; authorize BUILD_ACTIVE within the recorded
personal-account scope and budget; read AGENTS.md, TRACKER, PLAN, DESIGN,
READINESS and actual Git; record the final PREP_ONLY boundary and committed
transition; autonomously execute eligible DAG tasks while credentials arrive,
test and review at milestones, show the human an early working slice before
polish, stop only for real blockers or budget limits, and do not publish or
submit.
```

## Autonomous execution loop

Recover repository context → select one eligible TRACKER node → claim its
disjoint write ownership → implement only that objective → run its targeted
check → inspect real failure evidence → repair within the task’s retry/time/API
budget → record command result and `<commit>:<tree-id>` in TRACKER → continue.

One lead owns shared contracts, manifests/lockfile, integration, and TRACKER. At
most two isolated writers may operate concurrently on disjoint paths; reviewers
write nothing. Stop hooks may request one follow-up when full-check evidence is
missing, but they do not override interruption, resurrect a process, or prove
completion. Detect no progress by comparing failure/output and tree identity;
stop when the recorded repair limit is exhausted.

For a missing key, notify once, mark only the dependent live column blocked,
continue eligible offline work, and recheck only the approved config location at
a bounded checkpoint. Never poll home/private directories, print credentials,
or let a labeled fallback satisfy Slack or cloud acceptance.

## Task prompts

### P0-TRANSITION — boundary and capabilities

```text
Task P0-TRANSITION. Prerequisites: official opening observed, explicit
maintainer BUILD_ACTIVE scope/budget authorization, and a final clean PREP_ONLY
commit. Allowed: record evidence; commit the phase/TRACKER/provenance transition;
then inspect only authorized personal Slack, OpenAI and GCP capability and the
dependency gate. Non-goals: product implementation, employer access, billing or
provisioning beyond recorded scope, publication, submission.
Required checks: scope audit before and after transition; verify personal
contexts without token output. P0 does not require any live integration to
succeed.
Capability probes are separate and optional here: any Slack, model or target
check run now is recorded against CAP-SLACK/CAP-MODEL/CAP-GCP, and the ambient
acceptance test (brand-new unmentioned top-level message and unmentioned reply,
stable actor, bot/duplicate suppression, explicit owner callback) belongs to
SLACK-1's live column, not to P0.
Review gate: eligibility/provenance and security findings resolved or blocked.
Update TRACKER capabilities, evidence identity, costs, blockers and eligible
CORE-1/UI-1 work. Missing accounts block only their live nodes.
```

### CORE-1 / COORD-1 / UI-1 — early working slice

```text
Tasks CORE-1, COORD-1 and UI-1; require committed BUILD_ACTIVE. Deliver the
smallest inspectable deterministic slice: revision-bound proposal/approval
record, active hold and real adapter refusal, fresh elapsed observation, one
claim/continuation, read-back and retained receipt, owned by one recoverable
local coordinator/SQLite store. UI-1 follows DESIGN and may use visibly labeled
contract fixtures while backend credentials arrive.
Non-goals: model interpretation, extra surfaces/actions, Firestore, Trigger.dev,
second orchestrator, general conflict engine, styling beyond comprehension.
Tests: task-owned contract/state/persistence and coordinator tests; second-owner,
restart/gap, refusal, stale/unauthorized approval, duplicate claim, uncertain
dispatch and wrong-revision cases; web unit/build and early browser/visual check.
Review gate: no PLAN invariant failure; browser never accesses SQLite; current
and next state are immediately understandable. Update TRACKER separately for
implementation and live evidence.
```

### SLACK-1 / MODEL-1 / CLOUD-1 — capability branches

```text
Tasks SLACK-1, MODEL-1 and CLOUD-1; require committed BUILD_ACTIVE and stable
CORE-1 contracts. Work only the eligible branch; no shared contract/manifest or
lockfile edits while another writer is active.
Slack objective: ambient ordinary messages/replies in one authorized channel,
bounded attributed context, edits/thread provenance, trusted owner routing,
explicit revision-bound button approval, and bot/delivery/proposal deduplication.
Model objective: bounded proposal-or-abstain interpretation with no write
credential; test decision, hypothetical, negation, ambiguity, injection,
unknown/unsupported parameters and context removal.
Cloud objective: one allowlisted event-created Cloud Run revision; refusal while
held, persisted operation identity, reconcile uncertainty, promote once, and
read intended revision/routing/fresh health back.
Non-goals: mention-only substitution, arbitrary web research, extra channels,
extra condition families, extra adapters, model-decided authority/pass-fail.
Targeted tests run offline first. Each live column stays blocked until its real
bounded personal-account check succeeds. Review authority, cost and side-effect
evidence; update TRACKER with current tree and redacted receipt identity.
```

### REL-1 / RELEASE-1 — reliability and integration

```text
Task REL-1 after COORD-1: prove flapping, stale samples, observation/restart
gaps, revision/approval races, duplicate claims, uncertain outcomes and wrong
revision stay failed or NEEDS_INTERVENTION. Add no feature while an invariant
fails.
Task RELEASE-1 requires UI-1 and all Slack/model/cloud live criteria plus the
dependency/security exposure gate. Prove the complete ambient channel decision
through configured-owner approval, refused operation, an interrupted condition
that resets and is then re-satisfied, exactly one continuation,
target-specific verification and receipt.
Non-goals: fallback evidence presented as original integration success or late
scope expansion. Review gate: security/correctness plus browser/accessibility
review with no critical finding. Update TRACKER with evidence identity and
remaining limits.
```

### DEMO-1 — demonstration and submission

```text
Task DEMO-1 requires RELEASE-1 and time reserved before the portal deadline.
Freeze scope and rehearse a <=120-second loop: context → proposal → exact owner
approval → refused operation → condition reset then re-satisfied → one authorized
continuation → intended revision/routing/health verification → retained receipt.
Label shortened windows, synthetic incident input, test controls, local
fallbacks and mocks. Failed controls remain failed.
Run clean-clone install/check, browser and visual checks, secret/history scan,
provenance diff, reset and cleanup rehearsal. Fill truthful contribution,
inheritance, limitations, video and social placeholders.
Non-goals: late features, fabricated live claims, publication or submission.
Human authorization is required for video/social publication and portal submit.
Update TRACKER and SUBMISSION with real links/evidence only.
```

## Progressive gates

Run in this order; earlier success is not evidence for a later gate:

1. fast static/type/unit checks for the changed ownership area;
2. contract, state, and persistence tests;
3. coordinator integration and adapter-refusal tests;
4. restart, race, stale/flapping, and uncertain-outcome tests;
5. Playwright accessibility/state tests plus human visual inspection;
6. separately budgeted bounded real Slack, OpenAI, and target smoke tests;
7. recorded-demo rehearsal and clean-clone/submission checks.

Normal CI remains offline, secret-free, read-only, full-SHA pinned, and
non-deploying. Existing starter tests do not prove Interlock behavior.

## Canonical private test and recorded demo walkthrough

Run this once before either walkthrough:

```bash
npm run walkthrough
```

It performs offline repository preflight and creates exactly one confidential
operator artifact: `.interlock/walkthrough-notes.md`. The file starts empty,
has user-only permissions, is ignored by Git, is never populated by the script,
and is not submission evidence. If preflight fails, stop. The private test and
recording use the ordered flow below unchanged; recording adds screen capture
only.

### 0. Confidentiality and recording boundary

Before sharing or recording a screen, close `.env`, terminal history, browser
developer tools/network panels, private Slack history, the notes artifact, and
unrelated tabs. Hide notifications and verify no token, capability URL, private
message, account selector, or personal identifier is visible. Use a clean
terminal with only the commands below. Do not take screenshots, save traces, or
create another evidence file by default. Stop if any secret or unrelated
notification appears; rotate an exposed credential before retrying.

General idea, in six primitives:

1. **Intent:** an ordinary message states the exact candidate and sustained
   health condition.
2. **Scope:** trusted configuration narrows it to one workspace, channel,
   resource, target, and revision.
3. **Authority:** only the configured Slack owner can approve that exact
   proposal revision.
4. **Enforcement:** the coordinator's server adapter refuses promotion while
   the approved hold is active.
5. **Evidence:** fresh target observations must satisfy one continuous window;
   unhealthy, stale, gap, and restart evidence resets it.
6. **Closure:** one claim dispatches once, independent read-back verifies
   revision/routing/health, then a correlated receipt remains.

### 1. Local synthetic rehearsal

In terminal A:

```bash
npm run demo --workspace web -- --reset
```

In terminal B:

```bash
INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev:web
```

Open `http://localhost:3100`. Expected: the page says **TEST INPUT —
SYNTHETIC**, begins in an unhealthy `ACTIVE_HOLD`, records synthetic recovery,
permits one continuation after the six-second window, and ends with a retained
receipt for `v42`, 100% routing, and health `0.1`. This proves the real local
store/coordinator/supervisor control flow only. It proves no Slack, model, or
Cloud Run behavior. Stop and mark the walkthrough failed if the source label is
missing, the hold does not remain closed while unhealthy, the receipt differs,
or any service error is hidden. `Ctrl-C` only these two processes before retry.

### 2. Control Room review

Without changing product state, verify target and exact revision, configured
owner and approved revision, current/next state, independent coordinator and
Slack connectivity, threshold/window/elapsed time, reset/gap markers, lifecycle
rail, and expected-versus-observed receipt. Expected: semantic text communicates
each fact without relying on color, and no horizontal scroll is needed at the
recording size. Stop for stale/unavailable evidence, a mismatched revision,
ambiguous next action, clipped content, or a false connectivity claim.

### 3. Live capability gate

This stage is blocked until Slack is genuinely available. It is never replaced
by the synthetic rehearsal. After the operator has placed fresh credentials in
the approved ignored configuration, run:

```bash
npm run doctor
npm run channel:status
```

Expected: doctor reports OpenAI, CopilotKit, Slack, and GCP identity configured;
the managed Channel reports online; the configured workspace/channel/owner IDs
are the intended personal test identities; compromised prior Slack tokens are
revoked; target read-back is `checkout-v41` at 100%, `checkout-v42` is prepared
at 0%, and health is `0.1`. Confirm the dependency risk acceptance in
[READINESS](READINESS.md#dependency-security-gate). Stop on any missing,
stale, wrong-account, wrong-target, non-loopback, or hosted/public state. These
commands are live capability checks, not part of offline preflight.

### 4. Live Slack-to-receipt flow

Only after stage 3 passes, ensure no prior operation is uncertain, remove only
the dedicated walkthrough database from a stopped coordinator, and fault the
prepared target:

```bash
rm -f .interlock/walkthrough.db .interlock/walkthrough.db-wal .interlock/walkthrough.db-shm .interlock/walkthrough.db.lock
node --env-file=.env scripts/walkthrough.mjs --fault on
```

Start terminal A, then B, then C:

```bash
INTERLOCK_DB_PATH=.interlock/walkthrough.db npm run coordinator --workspace web
npm run dev:slack
npm run dev:web
```

Expected: all listeners bind loopback, the Slack Channel is online, and the
Control Room reports coordinator data with both coordinator and Slack connected.
Stop if enforcement is idle, the Channel is degraded, either heartbeat is
missing, or the page says synthetic.

In the one authorized channel, send this as a brand-new, unmentioned top-level
message (replace no values during the later recording):

```text
Hold the prepared checkout candidate until health stays at or below 0.5 for 10 continuous seconds, then promote that exact candidate.
```

Expected: one attributed proposal appears for the configured resource and exact
candidate revision. A wrong or duplicate proposal, bot loop, invented value, or
missing proposal is a failed run. The configured owner—and nobody else—clicks
the exact-revision approval button. An unauthorized actor must remain rejected;
do not use that negative control in the ≤120-second capture unless already
verified privately.

While the target is still unhealthy, run:

```bash
node --env-file=.env scripts/walkthrough.mjs --refuse
```

Expected: HTTP 409 refusal and an active hold; no target traffic movement.
Recover for about two seconds, interrupt recovery until the Control Room reset
count increases, then recover for the complete labeled window:

```bash
node --env-file=.env scripts/walkthrough.mjs --fault off
```

Wait until Control Room elapsed time reaches about two seconds, then:

```bash
node --env-file=.env scripts/walkthrough.mjs --fault on
```

Wait until the reset count increases, then:

```bash
node --env-file=.env scripts/walkthrough.mjs --fault off
```

Expected: the first partial window never authorizes dispatch; the interruption
adds a reset; the final continuous window causes exactly one claim and dispatch.
The Control Room must then read back `checkout-v42`, 100% effective routing,
fresh health `0.1`, `RETIRED`, and one retained receipt. Any timeout,
`NEEDS_INTERVENTION`, mismatch, duplicate dispatch, or uncertain response is a
failure and must remain visible.

### 5. Pass, reset, retry, and recording

Pass only when every item is true:

- [ ] confidentiality boundary held; the sole notes artifact stayed off-screen;
- [ ] synthetic rehearsal completed and remained visibly synthetic;
- [ ] live gate used fresh intended accounts and an online Slack Channel;
- [ ] one ambient message produced one exact scoped proposal;
- [ ] only the configured owner approved its exact revision;
- [ ] the held operation returned HTTP 409 without traffic movement;
- [ ] interrupted recovery visibly reset the continuous window;
- [ ] final recovery caused exactly one dispatch;
- [ ] read-back showed `checkout-v42`, 100% routing, fresh health `0.1`;
- [ ] workflow retired with one correlated receipt and no hidden failure.

If failure occurs before dispatch and external read-back still proves
`checkout-v41` at 100%, stop the three owned processes, turn the fault off, then
repeat from the dedicated-database removal. After dispatch or any uncertain
effect, do **not** delete state or retry: retain the database, read the target,
and resolve `NEEDS_INTERVENTION` first.

After a 100% private pass, prepare the identical recording by explicitly routing
the prepared service back to the known baseline, confirming read-back, stopping
the coordinator, and clearing only the dedicated walkthrough database:

```bash
gcloud run services update-traffic checkout --to-revisions checkout-v41=100 --project interlock-508417 --region us-central1
```

Then repeat stages 3–4 unchanged with capture enabled. The
[submission storyboard](SUBMISSION.md#demo-storyboard-120-seconds) is the
≤120-second shot list. If the live gate or private pass is incomplete, do not
record or claim the integrated demo.

## Offline synthetic rehearsal

This rehearsal is available before Slack access and does not satisfy
RELEASE-1 or DEMO-1. It uses the event-built SQLite store, coordinator, and
supervisor with one in-process synthetic target. The seeded revision-bound hold
starts unhealthy, so promotion remains refused, then receives a six-second
healthy window and permits one continuation. Both the coordinator snapshot and
Control Room identify the evidence as synthetic.

Start from a known local demo state:

```bash
npm run demo --workspace web -- --reset
```

In another terminal, point the Control Room at that loopback coordinator:

```bash
INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev:web
```

Open `http://localhost:3100`. Re-running the first command with `--reset`
removes only the local demo database and lock sidecars before reseeding it.
Without `--reset`, the persisted demo state is reused. This is local synthetic
workflow and restart/reset evidence only; it is not live Slack delivery or
approval, live model behavior, or GCP/Cloud Run evidence.

## Demo reset and cleanup

Preflight the authorized channel, configured owner, pending exact revision,
known target state, dependency gate, empty demo records, and shortened/synthetic
labels. Reset only records and routing explicitly listed in TRACKER. Never imply
that reset rolled back an uncertain effect.

Stop only processes started for the run. Revoke local sessions and created keys,
remove ignored secret files, uninstall the personal Slack app if authorized,
remove service-account impersonation grants, and restore/delete event-created
Cloud Run resources within the approved budget. Verify no unintended public
endpoint or paid recurring resource remains.

## Resume sentence

```text
Resume Interlock from repository evidence: read AGENTS.md, TRACKER, relevant
PLAN/DESIGN/READINESS sections and actual Git state; report phase, eligible DAG
node, ownership, current-tree check evidence, blockers and exact next action;
continue within recorded budgets, and never treat old chat text as authority.
```

Supported recovery is reopening the IDE chat or `cursor-agent --resume
<chat-id>` / `cursor-agent --continue` after authentication. Hooks can inject or
remind context only; they cannot restart a crashed or stopped process.
