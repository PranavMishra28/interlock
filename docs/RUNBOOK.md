# Interlock build-day runbook

This is a playbook, not authorization. Do not run P0 until the official build
opening and explicit maintainer approval. Check the live organizer portal for
the deadline; the published schedule currently separates 10:00 check-in from
the 11:15 build session.

## Arrival checklist

1. Read `AGENTS.md`, `TRACKER.md`, relevant `PLAN.md` sections, and actual Git
   status. Confirm no product work exists after the preparation PR.
2. Check the portal/organizer announcement for the opening and deadline. Record
   evidence, maintainer authorization, budget, branch, and HEAD in TRACKER.
3. Commit the final PREP_ONLY state. Its full SHA becomes
   `PREBUILD_COMMIT`; never move `pre-event-baseline`.
4. Verify personal-only OpenAI, Slack, and named gcloud contexts without
   printing tokens. Resolve the dependency security gate before live traffic.
5. Run the 20-minute Slack/cloud capability checkpoint. Freeze one surface and
   one target using PLAN fallback order.
6. In a later transition commit, set `.hackathon-phase` to `BUILD_ACTIVE`,
   `AUTHORIZATION=RECORDED`, and the final pre-build SHA; make the first three
   lines of TRACKER match. `bash scripts/scope-audit.sh` must pass. This
   committed transition—not a clock or environment variable—unfreezes source.

## P0 — official opening and transition

```text
Task P0. Read AGENTS.md, docs/TRACKER.md, PLAN §§1–4, and READINESS.
Prerequisites: organizer build opening observed; explicit maintainer BUILD_ACTIVE
authorization and budget recorded; final PREP_ONLY commit exists.
Allowed: read-only personal-account checks; narrowly reviewed dependency
remediation; inherited Slack and target capability checks; phase/provenance
transition. Do not implement product behavior yet, provision outside the agreed
personal scope, use employer access, publish, or submit.
Within 20 minutes prove subscribed Slack delivery, platform actor identity, and
approval callback, or freeze the web surface. Prove personal target access or
freeze the labeled local fallback. Record model IDs/API behavior and limits.
Required checks: clean install, check.sh, audit review, inherited web browser
smoke, no secret output.
Review gate: eligibility/provenance + security findings resolved or blocked.
Update TRACKER with authorization, pre-build SHA, surface, target, credentials
by name/status, costs/budget, checks, blockers, owner, and exact P1 action.
```

## P1 — deterministic vertical slice

```text
Task P1; requires completed P0 and BUILD_ACTIVE guard. Implement only the local
coordinator, one SQLite database, exact-revision approval, one server-side hold,
fresh elapsed observation, one allowlisted target adapter, one claim/dispatch,
target read-back, retirement, and retained redacted evidence from PLAN INV-02–09.
Initial isolated tests may use labeled fakes. P1 is not LIVE_COMPLETE until the
real selected target responds and is read back.
Non-goals: model interpretation, extra surfaces/actions, Trigger.dev, Firestore,
executor fleet, Auth0, general conflict engine, styling.
Tests: refusal while held; stale/unauthorized approval; timeout/gap; duplicate
claim; uncertain dispatch reconciliation; wrong-revision verification; restart.
Review gate: security/correctness review with no critical invariant failure.
Update TRACKER with files, test commands/results, real-vs-fake evidence,
blockers, active owner, and exact P2 action.
```

## P2 — contextual agency

```text
Task P2; requires passing P1. Add only selected-surface message ingestion,
bounded attributed context, interpretation/abstention, allowlisted reference
binding, and a visible proposal. The model has no write credentials.
Non-goals: extra surfaces, actions, broad memory, model-decided authorization,
or model-based observable pass/fail.
Tests: decision, hypothetical, negation, ambiguity, untrusted instructions,
duplicate delivery, unknown resource, unauthorized approval, and context
removal (remove supporting context from a resolvable reference; require
clarification/abstention).
Review gate: authority and prompt-injection boundaries traced end to end.
Update TRACKER with model/cost limits, evaluation counts, evidence, blockers,
owner, and exact P3 action.
```

## P3 — reliability

```text
Task P3; requires P1/P2 vertical loop. Add no feature while a critical PLAN
invariant fails. Prove flapping and stale-data reset, clock/restart gaps,
revision/approval races, duplicate delivery/claim, uncertain dispatch
reconciliation, and wrong-revision verification.
Non-goals: new channels, adapters, dashboards, or infrastructure.
Required tests: deterministic cases in PLAN §5 plus one process-restart run.
Review gate: failed controls stay failed/visible; no retry can duplicate effect.
Update TRACKER with reproducible commands, logs/receipts (redacted), unresolved
risks, owner, and exact P4 action.
```

## P4 — demo and submission preparation

```text
Task P4; requires critical P1–P3 evidence and time reserved before the live
portal deadline. Freeze scope. Rehearse a <=120-second live loop: context →
proposal → approved hold → refused operation → interrupted/restored recovery →
one authorized continuation → target-specific verification → retained receipt.
Label shortened windows, synthetic incident input, local fallback, and mocks.
Run clean-clone instructions, full checks, browser smoke, secret/history scan,
provenance diff, and cleanup rehearsal. Fill truthful contribution,
inheritance, limitation, video, and social placeholders.
Non-goals: late features or claiming failed/unverified integrations.
Review gate: repository HEAD/CI and every submission claim read back.
Update TRACKER and SUBMISSION. Do not publish or submit without explicit human
authorization.
```

## Demo, reset, and cleanup

- Preflight one opted-in workspace/thread, one approved operator, one pending
  revision, known baseline health, empty demo records, and target routing.
- The demo must visibly show the adapter refusing promotion while held, an
  observation interruption resetting recovery, one later continuation, exact
  revision/traffic/health read-back, and the retained receipt.
- Reset only demo records and routing explicitly identified in TRACKER. Never
  delete evidence needed for the submission or imply a reset rolled back an
  uncertain action.
- Stop only processes started for the demo. Revoke local sessions, remove
  ignored secret files, revoke API keys, remove Slack installation if created,
  delete any service-account impersonation grant, restore/delete event-created
  Cloud Run resources as authorized, and verify no public endpoint remains.

## Compact resume prompt

```text
Resume Interlock from repository evidence. Read AGENTS.md, docs/TRACKER.md,
relevant PLAN sections, and actual git status/log before acting; old chat
summaries are non-authoritative. State phase, HEAD/dirty paths, active task and
owner, blockers, last verified commands, and exact next action. Obey the
committed phase guard. Update TRACKER before a phase boundary or compaction.
One lead writes shared status; reviewers return findings only.
```
