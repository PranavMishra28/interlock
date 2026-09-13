# Interlock execution tracker

Phase: BUILD_ACTIVE
Build authorization: RECORDED
Final pre-build commit: `88b6309b071978fb2ec585b683392a11d5283358`

This is the only progress ledger. Git state and observed command results outrank
assistant summaries. The lead updates this checkpoint at phase boundaries and
before compaction.

## Checkpoint

- Inspected base: `main` at PR #10 merge
  `caf6e75`, which landed `ship-now`.
- Working branch: `main`. Post-merge work is authorized to go straight to
  `main`, but `main` rejects a direct push: protection requires the `verify`
  check and `ci.yml` runs it only on `main` pushes and pull requests, so each
  change still lands through a short-lived branch and merge. Do not weaken the
  check or the protection to avoid that step.
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
- Dirty ownership: lead owns TRACKER. Concurrent demo/walkthrough and
  CLOUD-1 verify-lengthen edits are uncommitted in this working tree; this
  pass records them rather than reverting them. No second TRACKER writer.
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
  (`us-central1`), driven by the bounded live harness removed after merge:
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
- Control Room identity checkpoint
  `748bd2d:eb9139c4386394a6ced8740a887c869f7ce079ee`: the supplied
  near-touching-hands reference is distilled into one scalable SVG mark and
  applied to the persistent product bar and application metadata. The premium
  neutral visual tokens are scoped to Interlock's frame, workflow state is
  adjacent to the active contract, loading reserves stable space, and the
  global boundary indicator is neutral rather than a fabricated connectivity
  signal. The chart threshold now derives from the actual contract instead of
  the synthetic fixture's hard-coded `1`; one focused projection test raises
  the web suite to 41 tests.
  - Targeted web typecheck, all 41 tests, and production build passed. Browser
    inspection at 1440×900 and 390×844 found one rendered H1, no retained
    loading region after hydration, no horizontal overflow, a visibly labeled
    synthetic source, and textual state/threshold/window/reset alternatives to
    semantic color and the plot.
- Local synthetic demo evidence
  `18da43d96dc030725628dd01483c5e6adcef3e81:92508112ceb1486043c346633c25adc376b1a40e`:
  web typecheck, all 43 web tests, the production web build, and the full
  `bash scripts/check.sh` passed on a clean tree at that commit. The
  loopback demo uses the real store, coordinator, and supervisor with one
  in-process synthetic target; it persists one approved revision-bound
  contract, starts unhealthy so promotion remains refused, then supplies a
  six-second healthy window for one continuation and supports a repeatable
  `--reset`. Its snapshot and UI are explicitly labeled synthetic. This proves
  only the local synthetic workflow and restart/allowlist behavior; it does not
  prove live Slack delivery or approval, OpenAI behavior, or any GCP/Cloud Run
  observation or promotion. No external account, paid call, or deployment was
  used.
- Scoped-identity live run and verification race 2026-09-12, evidence
  `c780780c91f4c813fb00d20d5754991d446455bb:728dfb473ab8f4a9f7b083812939c494061a0a94`:
  a bounded live run against `checkout` proved promotion now executes as the
  dedicated `interlock-exec` identity rather than the operator. The token's
  `azp` matched that service account's unique ID and no broad-ADC fallback
  warning was emitted, so the impersonated path was genuinely in effect. IAM is
  resource-scoped and key-free: `serviceAccountTokenCreator` for the maintainer
  is bound on the execution account itself, `run.developer` on the `checkout`
  service, `serviceAccountUser` on that service's runtime account, and the
  execution account holds no project-level role. While health read 0.9 the
  operation stayed refused and independent read-back confirmed `checkout-v41`
  at 100% — traffic did not move. After the healthy window exactly one
  promotion ran and the service now serves `checkout-v42` at 100% with health
  0.1.
  The run also exposed a real defect rather than a harness flake: the read-back
  taken immediately after the traffic update still observed `checkout-v41`, so
  an exactly-correct promotion was recorded as a mismatch, ending in
  `NEEDS_INTERVENTION` with no retained receipt. Routing is eventually
  consistent, and treating the first read as authoritative measured propagation
  delay and called it a failure. Verification now re-reads on a bounded
  schedule and fails closed unchanged when the target never converges; the loop
  only reads, so waiting longer cannot become a second dispatch, and the
  deadline is deliberately not a contract field. Retained receipts now carry
  the accepted sample's timestamp. Offline suites: 11 agent-core, 20
  channel-slack, 54 web.
  That run did not retain a receipt. A later 20-second verify against the
  already-lengthened-offline path still ended `NEEDS_INTERVENTION` while
  observing `checkout-v41`, even though an independent gcloud read later saw
  `checkout-v42`. The service was then reset. That is the race, not a missing
  promotion. The scoped receipt is the later 90-second verify below, not this
  paragraph.
- Execution and interface correctness pass 2026-09-12, evidence
  `eda8d005f67bd328fbde9aec6a012800c605195f:9950af813f744858e33dd942ebf58da2f5e0e151`:
  five defects found by review and closed with
  tests. (1) Hold readiness was computed only from target-reported timestamps,
  so a target that dated one sample in the past and the next slightly ahead
  satisfied the window in no real time; readiness now also requires the
  coordinator's own clock to have advanced, and stored workflows without a
  local window start restart it rather than inheriting a free pass. (2) The
  supervisor treats a missed polling opportunity as a `gap` using the timer's
  own heartbeat, so a slow target is not mistaken for a suspended machine.
  (3) The validated Intent primitive was imported only by its own test; the
  live Slack path built a separate prompt, so the suite proved guarantees the
  product did not provide. Ambient delivery now runs on the shared bounded,
  validated path. (4) The Control Room labelled a failed coordinator fetch as
  coordinator data, spaced its plot by array index so observation gaps were
  invisible, and presented snapshot time as a sample that never happened; all
  three now report what is actually known. (5) Cloud Run promotion exchanged
  the maintainer's own credentials and ran with their full permissions; it now
  executes through IAM Credentials as a dedicated scoped identity, and the
  unconfigured case warns visibly rather than falling back silently. Offline
  suites: 11 agent-core, 20 channel-slack, 51 web, 52 environment. This proves
  the local and offline behavior only; the scoped Cloud Run identity had not
  yet been re-verified live at this commit.
- Live GCP evidence: dedicated personal project `interlock-508417` provisioned
  in `us-central1` inside the $0 Always Free envelope, isolated in the named
  gcloud configuration `interlock`. After the scoped CLOUD-1 receipt the
  service was left at `checkout-v41` 100% with health 0.1; candidate
  `checkout-v42` remains the approved revision for the next rehearsal.
  `GET /health` returns the exact `{value, observedAt}` contract the adapter
  requires; an unauthenticated `POST /fault` is refused with 403 while a
  tokened call genuinely degrades health to 0.9 and recovers to 0.1. The
  teardown ledger is in READINESS.
- Current-tree verification 2026-09-12 (dirty `build-active`, not a clean
  commit): HEAD `97931228268015942f9aa3c17f9000d8476e2939`, product dirty-tree
  identity `f6558d94ab1d9e9c85ac6f5833861c289300410e`. Uncommitted paths in
  that identity: Slack listener copy, demo seed/story plus its test, 90s
  verification deadline plus coordinator test, RUNBOOK walkthrough, agent-core
  verify wait, and walkthrough script/test. Targeted gates: 11 agent-core, 54
  web, 20 channel-slack, walkthrough preflight, and docs-links. Subsequent
  `bash scripts/check.sh` passed on that same product tree (typecheck, all
  workspace tests, MCP stdio, web build, phase negatives, hooks, docs-links,
  workflow policy, action pins). No Slack attach was proven. This verification
  made no Cloud Run mutation; the scoped live receipt below is from the
  finished CLOUD-1 agent, not from this TRACKER pass. No cumulative PR to
  `main` exists. Strategy remains one PR titled `Build Interlock — ambient
  operational decision execution layer` only after production/demo-ready
  gates.
- Scoped CLOUD-1 live receipt 2026-09-12 on that dirty tree, impersonating
  `interlock-exec@interlock-508417.iam.gserviceaccount.com` (`azp`
  `113484116528661740722`), no broad-ADC fallback. Verification wait is 90s
  at 1s poll, read-only, fail-closed, still not a contract field. Degraded
  refusal: health 0.9, `allowed=false`, `ACTIVE_HOLD`, traffic stayed
  `checkout-v41` 100%. After the healthy window: exactly one promotion,
  workflow `RETIRED`, receipt matched `checkout-v42` 100% health 0.1, and an
  independent impersonated read-back confirmed. Final left state:
  `checkout-v41` 100%, health 0.1. This is LIVE_VERIFIED for the scoped
  identity path, not the earlier ADC-only promotion. That agent did not
  commit or push.
- Walkthrough: `npm run walkthrough` is the synthetic rehearsal path and does
  not require a Slack channel. Operator notes live at
  `.interlock/walkthrough-notes.md` (empty, mode 0600, gitignored); do not
  commit that file. DEMO-1 remains blocked on live Slack for a live recorded
  demo. The uncommitted demo seed now logs wrong-actor/wrong-revision refusal
  and hold-time promotion refusal; that is local synthetic evidence only.
- Slack attach proof 2026-09-12: secret-safe `npm run doctor` reported the
  attach credentials and configured identities present. `npm run
  channel:status` reported the existing `interlock` Channel with
  `adapters.slack: attached`; the bounded listener probe then reached
  `overall: online` and listened only on `127.0.0.1:3000`. No message or
  approval was posted. This clears the managed transport/listener capability,
  while the fresh ambient message/reply and configured-owner approval remain
  part of the unrehearsed RELEASE-1 integration flow.
- Current pass verification 2026-09-12 at clean committed checkpoint
  `2502f2eea81712d3ac3a4db6503aac128b2325e4:fce31840c1e0e5aa7de3d186f0ba8c5f8ca8095b`:
  `npm run walkthrough` passed its offline preflight; the targeted 11
  agent-core, 20 Slack, and 54 web tests passed. `npm run demo --workspace web
  -- --reset`
  refused wrong actor and wrong revision, accepted the exact configured demo
  owner, refused promotion during `ACTIVE_HOLD`, and reached one synthetic
  `RETIRED` workflow. The demo remained explicitly synthetic. Gcloud
  configuration `interlock`, project `interlock-508417`, and region
  `us-central1` were asserted, and independent read-back showed only
  `checkout-v41` at 100%; no promotion ran. The subsequent full `bash
  scripts/check.sh` passed on the same product tree, and `gitleaks git .
  --redact --no-banner` found no leak in 49 commits. Operator guidance follow-up
  `76bf42f3745c7c30ae57a99c525a235f57e02f89:b033443589e4a1b0ca93a3b9938b624b2cb25491`
  makes the empty-notes boundary, exact commands, surface ownership, and
  expected authority-to-closure beats explicit; its walkthrough test,
  documentation links, and full `bash scripts/check.sh` passed.
- Pushed-checkpoint re-verification 2026-09-12 at clean
  `1dda15ef6ded75e5d2a335c661507aeeb2bc6249:8510f81fbd46b82cff8b66809f6072905fae81bd`,
  the first identity that is both committed and present on
  `origin/build-active`. Recorded evidence had gone stale at `76bf42f3`
  because the operator-guide checkpoint was a TRACKER-only commit. Targeted
  documentation links and the walkthrough preflight test passed, then full
  `bash scripts/check.sh` passed and recorded current-tree evidence. This pass
  read only: no Cloud Run mutation, no Slack message or approval, no promotion,
  and no change to the live columns below.
- Cumulative PR and merge 2026-09-12: pushing `build-active` alone enqueued no
  required check, because `.github/workflows/ci.yml` triggers only on `main`
  pushes and pull requests. PR
  [#7](https://github.com/PranavMishra28/interlock/pull/7) `Build Interlock —
  ambient operational decision execution layer` was therefore opened from
  `build-active` into `main`; the required `verify` check passed in 1m45s and
  the PR was merged at 22:25:04Z as `cc4e89ec43ee29754810c8afda9464448f2dc8e5`.
  Recorded honestly: this merge happened **before** the live Slack-to-receipt
  rehearsal, so it did not wait for the RELEASE-1 and DEMO-1 acceptance stated
  in the next-action bullet below. Merging did not create live evidence. The
  live columns below are unchanged, and the unrehearsed live flow remains the
  outstanding work rather than something the merge settled.
- Post-merge cleanup removed unused starter guides, inherited chat/voice/search
  surfaces, static Control Room fixtures, and the direct live-check harness.
  The local synthetic walkthrough still uses the real coordinator, SQLite
  store, and supervisor path and remains explicitly synthetic. Full
  `bash scripts/check.sh` passed on the clean cleanup commit
  `db1eb5c3ed729981e8ddf803d4e2d19f89a0828d:e6d5b0d9d1c1c32677d5b045cdc9f7eb8c5a0789`;
  the walkthrough also reached one synthetic retained `v42` receipt.
- Demo presentation follow-up: the supplied near-touching-hands reference is
  not a repository asset. The sole tracked brand image remains
  `apps/web/src/app/icon.svg`, shared by Next.js metadata and the product bar;
  its small-size silhouette was simplified around a larger fingertip gap.
  `npm run demo` now starts the labeled synthetic coordinator and Control Room
  together; the separate commands remain documented for recording each surface.
- Single-command local verification 2026-09-12 at clean committed
  `34ea7ab75ab38d8c72e100496b8733750f85c9ef:44ec4591528507af443d2a9ea4c899f1d7ad7969`.
  Recorded evidence had gone stale when the icon commit moved HEAD past the
  previous run. `npm run demo` was exercised end to end: it reset the store,
  bound `127.0.0.1:4318`, waited for that port, then served the Control Room on
  `3100`. Observed in one run: wrong actor refused, wrong revision refused,
  exact owner approved revision 1, `ACTIVE_HOLD` with health 0.9, enforcement
  refused promotion with `allowed=false; reason=ACTIVE_HOLD`, synthetic
  recovery to 0.1, four unhealthy window resets, then `RETIRED` with one
  receipt whose `expectedRevision` and `observedRevision` were both `v42` at
  health 0.1. The coordinator snapshot reported `source: "synthetic"` and the
  Control Room rendered `TEST INPUT — SYNTHETIC` with the Slack listener
  honestly `Not connected`. A leftover run holding 4318 or 3100 previously
  surfaced as a mid-story `EADDRINUSE` stack trace and once failed
  `scripts/check.sh`; the command now names the port and pid and exits first.
  Targeted gates: 61 root, 44 web, and the walkthrough preflight plus its test.
  Full `bash scripts/check.sh` then passed on this clean tree. This pass made no
  Cloud Run mutation, posted no Slack message, and changed no live column.
- One-command demo merge 2026-09-12: a direct `git push origin main` was
  rejected with `GH006 ... Required status check "verify" is expected`, so the
  single-command work went through PR
  [#9](https://github.com/PranavMishra28/interlock/pull/9) `Make the local demo
  one command`. `verify` passed in 1m20s, the PR merged at 22:50:09Z as
  `b36e74c3c12d564b5299361a94ef73be2d9cc31d`, and the subsequent `main` push
  workflow also concluded success. Protection was not weakened. The deleted
  branch step was refused by repository policy, so `demo-one-command` remains.
- Brand mark checkpoint at clean committed
  `d83b3d17b1451f73b9d2b06f52c84743c00f9d79:9ed688e89fc73b4137d985758a6716ffc0f4561d`,
  the `ship-now` head that PR
  [#10](https://github.com/PranavMishra28/interlock/pull/10) then merged into
  `main` as `caf6e75`. `d83b3d1` flattens `apps/web/src/app/icon.svg`
  only; it is a 490-byte balanced SVG that keeps its `viewBox` and
  `aria-label`. Recorded evidence had gone stale when that commit moved HEAD,
  and a concurrent `bash scripts/check.sh` run had already re-recorded this
  exact identity, so this pass verified the binding instead of duplicating the
  gate. Targeted re-checks: web typecheck clean and 44 web tests passed. No
  Cloud Run mutation, no Slack message, and no live-column change.
- Socket Mode ambient path at `135761c5115d5831cb4cfae13e1d0ebcd9aa1498:998fdf107d1dc9bd598ae84be65cf57f75fca1a8`
  merged to `main` as `7c1ed40` through green `verify` on PR
  [#13](https://github.com/PranavMishra28/interlock/pull/13).
  The managed CopilotKit adapter forwards only bot mentions, so an ordinary
  `message.channels` event never reaches ingress; that is a transport limit,
  not an Interlock defect. The direct listener opens Slack's outbound
  `apps.connections.open` websocket with `INTERLOCK_SLACK_APP_TOKEN` (`xapp-`),
  maps each event onto the same `SourceMessage` ingress, bounded Intent,
  coordinator proposal, and exact-revision approval contract, and posts the
  card with `chat.postMessage`. Bots, other channels, deletions, and hidden
  subtypes fail closed; edits keep their logical id. `scripts/check.sh` passed
  on that clean committed tree; 28 channel-slack tests include the Socket Mode
  proposal and approval paths. The live column stays unverified until one real
  unmentioned `#incidents` message produces a workflow.
- Socket Mode carried a real unmentioned `#incidents` message to the listener,
  which settles the transport question: ambient pickup works, and Slack even
  redelivered the queued event after a restart. Ingress then failed closed
  inside Intent. `INTERLOCK_INTENT_PROMPT` ordered the model to "return only the
  supplied output shape" while supplying no shape, so a real model returned JSON
  with no `kind` and `intentOutputSchema` rejected it. Every synthetic run
  substitutes a deterministic stub model, so no offline check could have caught
  it; this was the first real model call on the path. The prompt now states both
  the proposal and abstain shapes, which repairs the managed adapter path too
  rather than only the Socket Mode caller. A prompt guard in
  `interlock-intent.test.ts` fails against the old prompt and passes against the
  new one. Two silent failures also became visible, because a dropped envelope
  and a dead socket looked identical from the channel: each envelope now logs
  its outcome, and handler rejections print instead of being swallowed.
  Targeted checks: 28 channel-slack tests, 11 agent-core tests, both typechecks
  clean. The live column still stays unverified: no proposal card has been
  posted and no approval has been exercised end to end.
- Interactive live-path verification 2026-09-12: the earlier real unmentioned
  human `#incidents` message established Socket Mode delivery. On the repaired
  tree, a fresh attributed two-message envelope then exercised the remaining
  live path with the real model, coordinator, Slack APIs, and Cloud Run:
  irrelevant context abstained; the explicit decision proposed revision
  `3290452699`; Slack posted a card tagging the configured owner; owner approval
  succeeded; `chat.update` replaced the button with a visible approved/observing
  acknowledgment; the Control Room showed `OBSERVING` at health 0.1 and then
  background-refreshed to `RETIRED`; the receipt bound expected and observed
  `checkout-v42` at 100% traffic and health 0.1. The target was reset to
  `checkout-v41` at 100% with its fault off for the next recording. This is
  compositional live evidence, not a claim that a second post-fix human Slack
  message was sent: the transport and downstream run were verified separately.
  The direct and managed listeners now supply up to 12 persisted, attributed
  same-thread messages to Intent. Other humans can contribute context, while
  only the configured owner can authorize the exact revision. The card labels
  that explicit action `Yes — approve <revision>`; free-text “yes”, emoji, and
  reactions remain non-authoritative. The Control Room uses background Router
  refresh every two seconds; a full-page meta refresh was tested and removed
  because it visibly flashed the loading skeleton.
- Remaining blockers: inherited dependency exposure still blocks public
  hosting. RELEASE-1 and DEMO-1 remain `BLOCKED_DEPS` until one continuous
  post-fix human Slack message-to-receipt rehearsal is captured; the verified
  transport and downstream live run are currently compositional evidence.
- Exact next action: with `checkout-v41` restored at 100%, the fault cleared,
  and the listener online, post one unmentioned #incidents message, confirm the
  log reports `slack events_api → proposed`, and click `Yes — approve
  checkout-v42`. Do not
  @-mention the bot. Do not present
  the managed adapter or the synthetic walkthrough as live Slack evidence.
  Video, social publication, and portal submission remain human-only.

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
| CAP-SLACK | Personal Slack workspace/app and ambient channel delivery | LIVE_VERIFIED | existing `interlock` Channel reports Slack attached; bounded listener probe reached `overall: online` on loopback; live message/approval rehearsal remains a RELEASE-1 gate |
| CAP-MODEL | Personal OpenAI project/key and agreed API budget | LIVE_VERIFIED | `gpt-5.4-mini-2026-03-17`; 9/9 bounded live eval on three consecutive runs; approximately $0.03 cumulative event spend against $100 cap |
| CAP-GCP | Dedicated personal GCP project, budget, target and execution identity | LIVE_VERIFIED | `interlock-508417`/`us-central1`; scoped exec `interlock-exec@interlock-508417.iam.gserviceaccount.com`; left at `checkout-v41` 100% health 0.1 after scoped receipt; unauthenticated fault refused 403 |

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
| CORE-1 | P0-TRANSITION | writer A | CAP-LOCAL | exact-revision contract, trusted owner/resource binding, persistence, hold/refusal, elapsed evidence, claim, retirement and retained receipt pass deterministic tests with labeled fixtures | task-owned contract/state/persistence tests, then `bash scripts/check.sh` | `eda8d005f67bd328fbde9aec6a012800c605195f:9950af813f744858e33dd942ebf58da2f5e0e151` | DONE_IMPL | NOT_REQUIRED |
| COORD-1 | CORE-1 | writer A | CAP-LOCAL | one long-lived coordinator owns SQLite; second-owner/restart/gap behavior and loopback API are proved; browser never opens DB | coordinator integration and restart tests | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | NOT_REQUIRED |
| UI-1 | CORE-1 | writer B | CAP-LOCAL | DESIGN Control Room renders real API data or visibly labeled fixtures; accessibility, stale/error/empty/gap/failure states pass browser and visual review | web tests/build, then bounded Playwright/visual checks | `eda8d005f67bd328fbde9aec6a012800c605195f:9950af813f744858e33dd942ebf58da2f5e0e151` | DONE_IMPL | NOT_REQUIRED |
| REL-1 | COORD-1 | writer A | CAP-LOCAL | flapping/stale/restart resets, revision races, duplicate claims, uncertain dispatch reconciliation and wrong-revision failure remain fail-closed | reliability tests and one process-restart run | `e4f6454:3f10b5e8f19e1d88f22249c363dd06b486eb6477` | DONE_IMPL | NOT_REQUIRED |
| SLACK-1 | CORE-1, COORD-1 | writer A, not concurrent with shared contract edits | CAP-SLACK only for live column | one authorized channel accepts a new unmentioned top-level event and unmentioned reply; preserves provenance/edits; suppresses duplicates/bots; persists owner binding so restart rebuilds it; routes explicit revision button to configured owner and rejects other actors | Slack unit tests; one bounded live capability script/runbook check | `eda8d005f67bd328fbde9aec6a012800c605195f:9950af813f744858e33dd942ebf58da2f5e0e151` plus attached/online proof at `2502f2eea81712d3ac3a4db6503aac128b2325e4:fce31840c1e0e5aa7de3d186f0ba8c5f8ca8095b` | DONE_IMPL (restart-safe approval; live path runs the validated Intent primitive) | LIVE_VERIFIED (existing managed Channel attached and listener online; message/approval E2E remains RELEASE-1) |
| MODEL-1 | CORE-1 | writer A | CAP-MODEL only for live column | bounded attributed context yields proposal or abstention; negation, ambiguity, unsupported condition, injection and context-removal cases fail safely; model has no write authority | deterministic eval set; one bounded live model check | `0c784c9` | DONE_IMPL | LIVE_VERIFIED |
| CLOUD-1 | COORD-1 | writer A | CAP-GCP only for live column | real adapter refuses held promotion; persists identity before dispatch; reconciles uncertainty; promotes only approved event-created revision; reads revision/routing/fresh health back | adapter contract tests; one bounded personal-target smoke | `eda8d005f67bd328fbde9aec6a012800c605195f:9950af813f744858e33dd942ebf58da2f5e0e151` plus scoped receipt recorded above | DONE_IMPL (promotion executes as a scoped impersonated identity) | LIVE_VERIFIED (scoped identity, held refusal, exactly one dispatch, retained receipt, independent read-back; left at `checkout-v41` 100% health 0.1) |
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
