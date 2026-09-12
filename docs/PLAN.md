# Interlock plan (prose only)

Status: PREP_ONLY. This is a specification, not implemented functionality.
Executable prompts, schemas, policies, state transitions, adapters, product UI,
fixtures, and deployment behavior are build-period work.

## 1. Product and bounded competition scope

Interlock turns an operational decision in an opted-in workspace into an exact,
approved, temporary constraint. It enforces that constraint at one controlled
operation, observes a real recovery condition, performs only the approved
continuation, verifies the target, retires the active constraint, and retains
evidence.

Deployment gating already exists in products such as GitHub and Datadog. The
planned contribution is not “a gate”; it is the context-native loop from a
conversation decision through revision-bound approval, observation, one
authorized continuation, independent read-back, and auditable retirement.

Competition scope:

- one opted-in incident/workspace;
- one pending non-remediation release;
- one recovery-condition family: a health measurement remains within a
  configured threshold for a configured elapsed window;
- one controlled operation: promote one prepared Cloud Run revision created
  during the event;
- at most two model roles: bounded intent/contract interpretation and
  read-only evidence narration;
- one guaranteed surface: the inherited web workspace;
- Slack only if the P0 checkpoint succeeds within 20 minutes.

The held release is not the emergency fix. Emergency remediation, rollback,
and independent administrator action remain outside this one-operation hold.
Recovery must never require the blocked promotion.

## 2. Chosen topology

### Minimum path

1. Keep the inherited TypeScript, Next.js, CopilotKit runtime, npm lockfile,
   and compatible package family. Use one model runtime.
2. Run one local coordinator as a separate long-lived Node process, not inside
   a Next.js request handler or hot-reload lifecycle.
3. The coordinator is the sole owner of one file-backed SQLite database and
   the recoverable workflow. The web process talks to it over loopback.
4. Use the existing web workspace as the guaranteed context and delivery
   surface.
5. If live Slack passes P0, reuse the inherited CopilotKit Channels path; do
   not add a second Slack framework.
6. The local coordinator calls the Google API directly using a dedicated,
   personal-project execution identity to promote one allowlisted prepared
   Cloud Run revision, then reads service routing and fresh health back.

SQLite is local only: never share its file with cloud workers or put it on
ephemeral serverless storage. The coordinator owns a fixed loopback port for
its lifetime; a second coordinator must fail on bind, and the web process never
opens the database. File permissions restrict the DB to the local user;
maintenance/restore requires the coordinator stopped. P0 records the reviewed
SQLite journal mode, busy timeout, and crash test. On restart the coordinator
reconstructs unresolved work from persisted records before dispatching. Sleep,
shutdown, a crashed process, or an observation gap resets the recovery window;
no evidence is inferred for the missing interval. This MVP is unavailable
whenever the local machine is offline.

Node 22 includes `node:sqlite` without a feature flag from 22.13 onward, but it
remains experimental in the recorded runtime. At P0 choose either that native
API or one reviewed compatible package based on the actual Node build; do not
preinstall one now.

### Authentication paths

- **Web fallback:** loopback-only coordinator; a server-side operator token is
  mapped to one configured operator ID and exchanged for an HttpOnly,
  same-site session. Every mutating request revalidates the session and exact
  contract revision. Display names and anonymous buttons carry no authority.
  The inherited `useHumanInTheLoop` approval is anonymous/request-local and
  must be replaced, not reused as authorization.
- **Slack option:** CopilotKit’s `identifyUser: "platform"` supplies the
  provider/workspace/user tuple. Approval additionally requires the
  allowlisted Slack workspace and user ID and must bind the clicked message to
  the exact proposal revision. The managed ingress must verify Slack delivery;
  application code deduplicates by stable event/delivery and suppresses bot
  messages.
- **Cloud operation:** a personal human creates the target and prepared
  revision. The local coordinator uses ADC impersonation for a dedicated
  execution service account—no downloaded key—with target-scoped Cloud Run
  update/read permission and only the required ability to act as the target
  runtime identity. Exact permissions are tested before enabling the adapter.

Cloud administrators and operations already dispatched can bypass Interlock;
the UI must say so. A remotely hosted coordinator is out of scope until it has
a reviewed persistent-storage, locking, and authorization design.

### Explicit deferrals

Trigger.dev, Firestore, a separate executor fleet, Auth0/CIBA, vector
databases, extra channels, extra sponsors, Kubernetes, and a new deployment
app are not on the minimum path. They remain future options, not prerequisites.
The local fallback target is acceptable only when genuinely running and clearly
labeled; it must never be presented as Cloud Run success.

### Decision consequences

Benefits: fewer credentials and failure domains, deterministic local recovery,
one authoritative store, no cross-system transaction fiction, and a realistic
hackathon critical path.

Lost guarantees: the coordinator has single-machine availability; SQLite has
one owner; local auth is appropriate only for a one-operator demo; no managed
workflow scheduler resumes while the laptop is unavailable. Revisit this
topology only after the vertical slice works and a concrete requirement exceeds
those limits.

Fallback order:

1. Slack checkpoint fails → use the real web workspace; never imitate Slack.
2. Personal GCP access or target setup fails → use a genuinely running local
   target labeled “local”; do not claim cloud execution.
3. Model access fails → deterministic P1 may proceed, but P2 and an agent claim
   remain blocked.

## 3. Requirements and invariants

These stable IDs govern implementation and tests.

- **INV-01 Untrusted context.** Conversation, page context, fetched content,
  tool results, and model output are untrusted. Resolve references only against
  allowlisted resources. Missing duration, target, permission, or URL requires
  clarification or abstention; never invent it. Health and target URLs must
  exactly equal the approved allowlist row, not merely share a host.
- **INV-02 Revision-bound authority.** One verified operator approves one exact
  contract revision. Immediately before atomically claiming an operation,
  revalidate operator authority, expiry, target, revision, and fresh condition
  evidence. Conflicting active proposals are rejected. The model never decides
  which person outranks another, and a conflicting message cannot remove an
  approved hold.
- **INV-03 Fail-closed hold.** Expiry of an unapproved proposal creates no
  hold. Once an approved hold is active, timeout, missing evidence, or process
  failure cannot authorize release; explicit operator resolution is required.
- **INV-04 Server enforcement.** The server-side adapter—not a disabled
  button—enforces the hold for the one allowlisted promotion. It does not bind
  independent cloud administrators or operations already dispatched.
- **INV-05 Fresh elapsed evidence.** Measure elapsed time and sample freshness,
  not sample count. Unhealthy readings, stale samples, clock uncertainty, and
  restart or observation gaps reset the window. Sampling proves nothing between
  observations.
- **INV-06 Durable identity and deduplication.** Persist source delivery,
  intent, revision, and operation identity before dispatch. Deduplicate
  deliveries and claims. Database atomicity ends at the cloud boundary.
- **INV-07 Uncertain effects.** When dispatch outcome is uncertain, read the
  external target before retrying. Never blindly repeat a consequential effect.
- **INV-08 Target-specific verification.** Verify the intended revision,
  effective traffic routing, and fresh health. A post-action failure is
  `VERIFICATION_FAILED`/`NEEDS_INTERVENTION`; it is not evidence that no action
  happened or that rollback occurred.
- **INV-09 Evidence retention.** Retire active constraints but retain redacted
  evidence correlating source message, approved revision, operator, operation,
  target, samples, and verification.
- **INV-10 Bounded agency.** The intent role may propose or abstain but has no
  write credential. The optional verifier fetches independent observations;
  deterministic checks decide observable pass/fail. Do not add model calls to
  inflate an agent count.

## 4. Slack evidence from inherited code

The inherited `apps/channel-slack/src/channel.tsx` subscribes a thread in
`onMention`, then runs the agent. Its `onMessage` runs only when
`thread.isSubscribed()` is true. `identifyUser: "platform"` derives a canonical
provider identity.

The inherited `propose_action` in `apps/channel-slack/src/tools.tsx` is demo
behavior only. A click updates the proposal message; it does not authorize a
domain action, resume the agent, or execute anything. Inline handlers require
the listener to remain alive and are not restart-reconstructible. P0 must prove
real subscribed-message delivery,
stable actor identity, duplicate handling, bot-message suppression, and an
approval callback before Slack is selected.

Required Slack scope is one visibly opted-in thread/workspace, not ambient
monitoring of every channel. The thread must visibly show monitoring active and
how the operator stops it. Document the generated manifest’s event
subscriptions and least-required history/mention permissions after setup.

## 5. Acceptance scenarios

P1 deterministic evidence:

- persist a proposal, approve its exact revision, activate the hold, refuse the
  controlled promotion while held, observe a continuous fresh recovery window,
  claim once, dispatch once, read back the intended target, retire the active
  hold, and retain the receipt;
- reject stale approval, unauthorized approval, a conflicting active proposal,
  a duplicate delivery/claim, and a non-allowlisted target;
- interruption or timeout after activation leaves an unresolved hold;
- uncertain dispatch reconciles before retry;
- wrong revision or unhealthy read-back becomes intervention, not success.

P2 contextual evidence:

- decisions can produce bounded proposals; hypotheticals, negation, ambiguity,
  untrusted instructions, unknown references, and missing parameters abstain;
- remove supporting conversation context from an otherwise resolvable
  reference: the agent must clarify or abstain;
- duplicate source messages do not duplicate proposals; unauthorized approval
  does not advance work.

P3 reliability evidence:

- unhealthy/stale/flapping readings and clock/restart gaps reset elapsed
  recovery;
- restart recovers one unresolved hold without duplicate dispatch;
- edit/approval and claim races fail closed;
- uncertain external outcome and wrong-revision verification remain visible.

The demo uses shortened windows and synthetic incident inputs only when visibly
labeled. A failed control stays visibly failed; it never becomes a green
animation.

## 6. Sources checked

- Organizer portal and eligibility: https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM
- CopilotKit Channel API: https://docs.copilotkit.ai/reference/channels/classes/Channel
- CopilotKit Slack identity: https://docs.copilotkit.ai/slack/identity-and-memory
- Slack message events: https://api.slack.com/events/message
- Slack app mentions: https://api.slack.com/events/app_mention
- Node SQLite: https://nodejs.org/api/sqlite.html
- Cloud Run traffic: https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration
- Cloud Run IAM roles: https://cloud.google.com/run/docs/reference/iam/roles
- Cloud Run service identity: https://cloud.google.com/run/docs/configuring/services/service-identity

Checked 2026-09-12 PDT. Context7 could not authenticate during preparation;
the primary pages above and pinned repository source were used directly.
