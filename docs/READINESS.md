# Interlock readiness

Status: BUILD_ACTIVE. Offline checks are not evidence that Interlock or a live
integration works.

Status vocabulary: `OFFLINE_READY`, `KEY_REQUIRED`, `ACCESS_REQUIRED`,
`LIVE_VERIFIED`, `DEFERRED`.

Organizer portal checked 2026-09-12 01:17 PDT: check-in begins 10:00,
the build session is 11:15–3:30, and the schedule allocates 3:30–4:00 to
complete submissions. The live portal/organizer instruction remains
authoritative for opening and deadline.

## Toolchain and reproducible commands

Observed 2026-09-12 PDT:

| Item | Version / state |
|---|---|
| Node | v22.23.1; `.nvmrc` = 22; manifest requires `>=22` |
| npm | 10.9.8; one inherited lockfile, lockfileVersion 3 |
| git | 2.55.0 |
| GitHub CLI | 2.96.0; personal `PranavMishra28` session |
| gitleaks | installed |
| gcloud | installed, but no authorized personal Interlock project |
| jq | `/opt/homebrew/bin/jq`; required by project hook scripts |
| Cursor IDE | 3.20.17; trusted project hooks supported |
| Cursor Agent CLI | 2026.03.30-a5d3e17; resume flags available; not authenticated |
| Trigger.dev CLI / SDK | absent and deferred |

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
```

`check.sh` requires no credential or paid call. It runs inherited strict
typechecks/tests/MCP stdio verification, the inherited web build, the committed
phase/scope guard and its negative cases, the hook fixtures, the canonical
document-link check, the workflow trigger policy and the full-SHA action-pin
check, then records current-tree completion evidence. There is no inherited
formatter/linter; do not add coverage theater.

Key inherited versions: Next 15.5.25, React 19.2.8, TypeScript 5.9.3,
`@copilotkit/runtime` 1.70.3, `@copilotkit/react-core` 1.70.1,
`@copilotkit/channels` 0.9.2, `@ag-ui/client` 0.0.59 (root override),
`@ai-sdk/openai` 3.0.109, `tsx` 4.23.13.

Project-local Cursor hooks are configured in `.cursor/hooks.json` for trusted
IDE workspaces. The current IDE loaded and ran the safe shell hook; direct
fixtures verify session context, pre-compaction notice, deny/ask/allow
decisions, interruption handling, one-loop completion gating, and
current-tree-bound check evidence. A new session is still required to observe
`sessionStart`; `preCompact` only notifies and cannot block compaction. Hooks are
not a sandbox and cannot restart a process. Supported manual recovery is IDE
chat reopen or `cursor-agent --resume/--continue`; the installed CLI is not
authenticated, and no login was performed. Hook decisions are appended to
`$(git rev-parse --git-dir)/interlock-hook-events`, which stays out of Git and
records the decision only, never command text. `check.sh` sets
`INTERLOCK_CHECK_RUN=1` when it records evidence; that marker only stops a bare
`check-evidence.sh record` from standing in for a check, and anyone who sets the
variable deliberately is asserting a result rather than proving one.

Known control limits, stated rather than implied: branch protection can require
the `verify` check, but this personal repository has no organization-level
required-workflow control, so a pull request could in principle edit
`.github/workflows/ci.yml` or `scripts/check.sh`. The trusted base-branch guard
step re-runs `scope-audit.sh` from the base commit, which is what makes the
phase guard itself non-editable by a pull request; workflow edits remain a
review responsibility.

## Chosen-MVP readiness

Credential values belong only in ignored local configuration or the owning
platform’s secret store. A package or placeholder is not authentication.

| Capability | Account/package | Purpose | Credential names and expected location | Access prerequisite | Safe activation check | Status |
|---|---|---|---|---|---|---|
| Local coordinator + SQLite | Node 22 native `node:sqlite` | sole durable workflow/store | `INTERLOCK_DB_PATH` and `INTERLOCK_COORDINATOR_TOKEN` in ignored `.env` | writable local directory; one coordinator owner | create/reopen disposable DB; prove second owner fails; restart recovery test | **OFFLINE_READY** (implemented; native API remains experimental) |
| Control Room session | existing Next web + local coordinator | read-only evidence display; no mutating web controls exist | none for read-only loopback page; reserved `INTERLOCK_OPERATOR_TOKEN`, `INTERLOCK_SESSION_SECRET`, `INTERLOCK_OPERATOR_ID` only if authenticated controls are later added | loopback-only browser/coordinator | synthetic states visibly labeled; coordinator failure, stale/gap/empty/intervention/receipt states checked | **OFFLINE_READY** (read-only) |
| OpenAI model | inherited runtime / `@ai-sdk/openai` | bounded interpretation; optional evidence narration | `OPENAI_API_KEY`, `MODEL`, `MODEL_PROVIDER=openai` in ignored `.env` | personal account/project and separate API credits/budget | at P0 list models; confirm structured/tool behavior; one bounded call | **KEY_REQUIRED** |
| CopilotKit web | inherited packages | base for the future evidence-only Control Room | inherited OpenAI names above only for starter chat | model key for inherited live chat | offline build/info route exercised; no Interlock round trip exists | **OFFLINE_READY** |
| Slack primary | inherited `@copilotkit/channels` transport, behavior replaced after P0 | ambient conversation and exact-owner approval in one authorized incident channel | `INTELLIGENCE_API_KEY`, `CHANNEL_CODE`, `INTERLOCK_COORDINATOR_URL`, `INTERLOCK_COORDINATOR_TOKEN`, `INTERLOCK_SLACK_WORKSPACE_ID`, `INTERLOCK_SLACK_CHANNEL_ID`, `INTERLOCK_OWNER_ID` in ignored server config | personal workspace/app, generated manifest, channel install, required scopes/events/interactivity | brand-new unmentioned top-level message and unmentioned reply each arrive once; edits/thread provenance retained; stable actor; bot/duplicate suppressed; configured owner’s exact-revision button callback arrives once | **ACCESS_REQUIRED** (offline ingress/authority tests pass) |
| Cloud Run target | direct Cloud Run v2 REST adapter; no new package | one prepared revision promotion and independent read-back | personal named gcloud config; ADC impersonating dedicated execution SA; `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `INTERLOCK_TARGET_SERVICE`, `INTERLOCK_TARGET_REVISION`, `INTERLOCK_TARGET_URL` in ignored `.env` | explicit budget; personal project/billing; APIs; target-scoped IAM; event-created target/revision | confirm active personal project without printing tokens; read service; denied non-allowlisted target; promote allowed revision; read routing and fresh health | **ACCESS_REQUIRED** (offline request/read-back contract tests pass) |
| Local fallback target | existing local runtime chosen at P0 | honest fallback if cloud access fails | local target URL in ignored `.env` | genuinely running local process | dispatch, read-back, restart/reset; UI labels “local” | **OFFLINE_READY** (not built) |
| Trigger.dev / Firestore / executor fleet / Auth0 | not installed | future hosted topology | none for MVP | separate reviewed design | none | **DEFERRED** |

OpenAI owner action at P0: use a personal project, set a small agreed budget,
resolve actual model IDs and supported API behavior, cap calls/tokens/retries,
and append a cost record without exposing the key. Coding subscriptions do not
imply API credits.

Slack scope after the committed P0 transition: exactly one
administrator-authorized incident channel. Confirm generated event
subscriptions and only required channel/history/interactivity permissions.
Store platform workspace/channel/user IDs, suppress bot/subtype loops,
deduplicate stable event/delivery/proposal IDs, preserve reply/edit provenance,
and validate an explicit button against actor and exact proposal revision. The
inherited mention subscription and demo button are not acceptance evidence.

Cloud owner action at P0: create/select a dedicated personal project only after
budget approval; isolate it in a named gcloud configuration; create the target
and prepared revision during the event; use a dedicated execution identity via
ADC impersonation rather than a key; scope update/read permission to the target;
record teardown. Never use employer gcloud/ADC or expose an unauthenticated
endpoint.

## Dependency security gate

GitHub reports 19 open transitive runtime alerts in `package-lock.json`:
PostCSS (including high severity), Undici (including high), `qs`, and
`@opentelemetry/core`. `npm audit` reports 14 dependency nodes (2 high,
11 moderate) plus one misleading critical result: this workspace is named
`agent-core`, which npm matches to an unrelated registry advisory; the local
workspace is not that package.

Affected paths observed:

- Next 15.5.25 → PostCSS 8.4.31;
- CopilotKit runtime / AI SDK → Undici 5.29.0 and 6.28.1;
- Express 4/5 → `qs` 6.15.3 (one 6.16.0 path is fixed);
- LangSmith tracing → OpenTelemetry 2.7.1.

A disposable `npm update --package-lock-only qs undici postcss
@opentelemetry/core` trial made no change. Dependabot’s proposed repair also
upgraded Next 15→16 and rewrote inherited config; it was not merged. Forcing
transitive overrides would cross package compatibility contracts, especially
Undici 5→6, without upstream evidence.

**Restriction:** do not host or publicly expose the inherited starter and do
not enable live Slack/model traffic until P0 reviews updated upstream releases
or narrowly scoped compatible parent-package patches. Any accepted difference
must be recorded in provenance and pass clean install, tests, build, browser,
and audit checks. Do not dismiss the alerts or force a major just to make the
count green. If high-severity reachable paths remain, live use is blocked and
the local deterministic slice stays offline.

Two inherited security boundaries also block deployment as-is:

- `scripts/check-env.sh` sources `.env` as shell code. Use only a
  maintainer-created file during offline preparation; in BUILD_ACTIVE replace
  this with strict `KEY=VALUE` parsing before adding real credentials.
- the inherited CopilotKit, realtime-token, and search routes have no Interlock
  operator session. BUILD_ACTIVE disables those routes, redirects the inherited
  voice page, and pins web/coordinator listeners to loopback. Do not re-enable
  them or deploy without a separate authenticated design and dependency review.

## Verified preparation evidence

- Immutable import: all 75 files at `79b036635c01d932374bed1013b901283f421096`
  match upstream `2622f07d17850ad68bb9a7266c566c1fefc97df4`.
- Annotated `pre-event-baseline` remains at
  `76897ddd227c4d3f06e35063679e7189d075f747`.
- Existing main CI: [run 34641117900](https://github.com/PranavMishra28/interlock/actions/runs/34641117900),
  `verify` succeeded at that commit.
- Preparation [PR #3](https://github.com/PranavMishra28/interlock/pull/3):
  required `verify` [run 34683710278](https://github.com/PranavMishra28/interlock/actions/runs/34683710278)
  passed; merged as `72dbc2163abbb86244549afd07461328030aa8e6`;
  push [run 34683950172](https://github.com/PranavMishra28/interlock/actions/runs/34683950172)
  passed.
- Previous fresh clone: `npm ci` and `bash scripts/check.sh` passed; inherited
  web rendered locally with no live model call. Evidence image:
  `docs/evidence/inherited-starter-web-2026-09-11.png`.
- GitHub read-back at baseline: public personal repo; secret scanning and push
  protection enabled; Dependabot alerts/updates enabled; private vulnerability
  reporting enabled; protected `main` requires strict `verify`, blocks force
  push/deletion, applies required checks to administrators, and requires no
  human reviewer. Non-provider secret patterns were unavailable on this plan.
- Preparation verification after review repair: `bash scripts/check.sh` passed
  in 49 seconds; phase/self-widening and workflow-policy negative cases passed;
  the inherited browser page and info/thread resources loaded locally without
  a model call; gitleaks found no leaks in history, source, ignored generated
  artifacts checked, or task logs.

Current preparation-PR results are recorded in TRACKER when run; do not infer
them from the baseline evidence above.

## Unresolved eligibility and access risks

1. The handbook permits reusable building blocks but does not expressly
   authorize every custom pre-event integration. No custom integration is made.
2. Official opening and explicit maintainer authorization were recorded at the
   P0 transition; the portal deadline must still be checked before submission.
3. Personal OpenAI credits/budget, personal Slack setup, and personal GCP
   project/budget are not live-verified.
4. Dependency reachability/remediation must be resolved before live traffic.
5. The local topology loses availability when the laptop sleeps or disconnects.

Primary sources: organizer portal in PLAN; CopilotKit/Slack/Node/Cloud Run
links in PLAN §6; GitHub advisory URLs are available in the repository Security
tab. Context7 authentication was unavailable during this audit, so no claim is
based on it.
