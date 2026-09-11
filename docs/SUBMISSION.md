# Submission checklist (draft, PREP_ONLY — nothing submitted)

Deadline and rubric: the [official portal](https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM)
and [handbook](https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM/handbook)
govern. Do not guess a timezone or copy another city's deadline. Publishing
the post and submitting the entry are separate human actions.

## Provenance credit (must appear in the description and the repo)

Inherited: [CopilotKit/agents-everywhere-starter-kit](https://github.com/CopilotKit/agents-everywhere-starter-kit)
@ `2622f07` (MIT) — web template (Next.js + CopilotKit React + runtime),
`agent-core` factory, verify scripts. Built during the event: **(fill in from
`HACKATHON_PROVENANCE.md` → Event work; point to files/commits).**

## Evidence for the four official criteria

| Criterion | Evidence to show | Where it will live | Status |
|---|---|---|---|
| Core Requirements & Functionality | one complete workflow: decision in thread → contract → approval → hold → promotion → verified revision → retired; run live, not mocked | demo video 0:20–1:30; acceptance cases in `docs/PLAN.md` §7, trial counts recorded in `docs/READINESS.md` during the event | not started |
| Innovation & Theme Alignment | the *conversation + live environment* is the context; show what is lost without it (a standalone chatbox cannot bind to the pending release or hold the traffic) | video intro; README "why context matters" | not started |
| Technical Execution & Integration | show a failure/cancellation path: edited-after-approval invalidation **or** flapping health resetting the window **or** expired hold; explain reconciliation of a lost response | video 1:30–1:50; deterministic tests | not started |
| Usefulness & Agentic Experience | operator sees proposal, approves the exact revision, watches samples with timestamps, retains control (deny/cancel), gets an evidence trail | UI projection; video | not started |

- [ ] Every criterion has visible evidence
- [ ] Live services vs sample data vs session-only state are labeled
- [ ] Sponsors used are named with their concrete contribution (count is not a criterion)

## Public repository

- [ ] Fresh clone quickstart works (`npm ci && bash scripts/check.sh`)
- [ ] README lists credentials by **name** and the separate processes (web app, Trigger.dev dev, executor)
- [ ] CI green on the submitted commit; `HACKATHON_PROVENANCE.md` event table filled
- [ ] No `.env`, tokens, transcripts, screenshots with secrets, or waitpoint URLs
- [ ] Post-event cleanup documented (delete worker SA key, tear down Cloud Run services)

## Two-minute demo storyboard (≤120 s, draft)

| t | Shot | Says |
|---|---|---|
| 0:00–0:15 | Incident page + thread already open; pending revision visible in the resource panel | "An on-call thread. A release is prepared but held. This is the context Interlock lives in." |
| 0:15–0:35 | Teammate types the decision; Interlock proposes a contract card (target, condition, window, continuation, expiry) | "It heard a decision, not a hypothetical, and proposed a typed constraint. It invented nothing: target and health URL come from an allowlist." |
| 0:35–0:50 | Operator logs in / approves; card shows revision-bound approval | "Approval binds to this exact revision. An edit would void it." |
| 0:50–1:15 | Hold timeline: samples with timestamps; one unhealthy sample resets the window | "Fresh samples only. A gap or a blip resets the window; it never assumes continuous health." |
| 1:15–1:35 | Window satisfied → executor promotes the prepared revision → verifier reads back traffic + fresh health | "The continuation is a traffic shift to a revision built earlier today. Verification checks the served revision, not the request." |
| 1:35–1:50 | Failure path: an edited contract shows its old approval invalidated (or expired hold banner) | "A timeout is neither consent nor recovery — it leaves an operator-owned hold." |
| 1:50–2:00 | Evidence trail; provenance line | "Built today on the CopilotKit starter kit, Trigger.dev, Firestore, Cloud Run, OpenAI. Repo linked." |

## Draft copy (DRAFT — not published; no URLs invented)

**Title:** Interlock — approve a constraint, not a click

**Description (draft):** Interlock is an ambient operational-control agent for
an on-call team's text workspace. When someone states a decision — "hold the
release until checkout latency is back under 2 s for 15 minutes, then ship
it" — Interlock proposes a typed constraint bound to a real, allowlisted
target. An authenticated operator approves that exact revision. A durable
workflow enforces the hold on the one controlled action, watches fresh health
samples, promotes the prepared release when the window is satisfied,
independently verifies the served revision, and retires the constraint with a
full evidence trail. Timeouts never execute; edits void approvals; UI is a
projection, never authority. Built during Agents, Everywhere on the CopilotKit
starter kit with OpenAI, Trigger.dev, Firestore, and Cloud Run.

**Social post (draft):** Built Interlock at #AgentsEverywhere with
@AITinkerers: an agent that turns an on-call team's *decision* into an
approved, enforced, verified operational constraint — hold a release, watch
real health, ship the prepared revision, prove it. Not a chatbot. Repo + demo:
(links added after recording). Thanks @CopilotKit @OpenAI (+ sponsor tags per
organizer instructions).

Demo video URL: _none yet_. Social post URL: _none yet_. Repo:
https://github.com/PranavMishra28/interlock
