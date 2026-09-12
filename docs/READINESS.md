# Interlock readiness

Status: PREP_ONLY. Offline starter checks are not evidence that Interlock or a
live integration works.

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
| Trigger.dev CLI / SDK | absent and deferred |

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
```

`check.sh` requires no credential or paid call. It runs inherited strict
typechecks/tests/MCP stdio verification, the inherited web build, the committed
phase/scope guard and negative cases, and the full-SHA action-pin check. There
is no inherited formatter/linter; do not add coverage theater.

Key inherited versions: Next 15.5.25, React 19.2.8, TypeScript 5.9.3,
`@copilotkit/runtime` 1.70.3, `@copilotkit/react-core` 1.70.1,
`@copilotkit/channels` 0.9.2, `@ag-ui/client` 0.0.59 (root override),
`@ai-sdk/openai` 3.0.109, `tsx` 4.23.13.

## Chosen-MVP readiness

Credential values belong only in ignored local configuration or the owning
platform’s secret store. A package or placeholder is not authentication.

| Capability | Account/package | Purpose | Credential names and expected location | Access prerequisite | Safe activation check | Status |
|---|---|---|---|---|---|---|
| Local coordinator + SQLite | Node 22; SQLite choice made at P0 | sole durable workflow/store | `INTERLOCK_DB_PATH` in ignored `.env`; no secret | writable local directory; one coordinator owner | create/reopen disposable DB; prove second owner fails; restart recovery test | **OFFLINE_READY** (design only) |
| Web operator identity | existing Next/CopilotKit web + local coordinator | guaranteed surface and approval identity | `INTERLOCK_OPERATOR_TOKEN`, `INTERLOCK_SESSION_SECRET`, `INTERLOCK_OPERATOR_ID` in ignored `.env`, server-only | loopback-only browser/coordinator | wrong token rejected; correct session maps fixed operator ID; anonymous/display-name approval rejected | **KEY_REQUIRED** |
| OpenAI model | inherited runtime / `@ai-sdk/openai` | bounded interpretation; optional evidence narration | `OPENAI_API_KEY`, `MODEL`, `MODEL_PROVIDER=openai` in ignored `.env` | personal account/project and separate API credits/budget | at P0 list models; confirm structured/tool behavior; one bounded call | **KEY_REQUIRED** |
| CopilotKit web | inherited packages | page context, chat, UI/runtime transport | inherited OpenAI names above | model key for live chat | offline build/info route already exercised; real round trip pending | **OFFLINE_READY** |
| Slack option | inherited `@copilotkit/channels` path | optional real conversation surface | `INTELLIGENCE_API_KEY`, `CHANNEL_CODE` in ignored `.env`; personal Slack app/workspace installation owned by the maintainer | personal workspace/app, generated manifest, required scopes/events | within first 20 minutes: mention subscribes; ordinary subscribed reply arrives once; stable platform actor; bot event suppressed; exact-revision approval callback arrives once | **ACCESS_REQUIRED** |
| Cloud Run target | gcloud/Google APIs; no new package selected | one prepared revision promotion and independent read-back | personal named gcloud config; ADC impersonating dedicated execution SA; `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `INTERLOCK_TARGET_SERVICE`, `INTERLOCK_TARGET_REVISION` in ignored `.env` | explicit budget; personal project/billing; APIs; target-scoped IAM; event-created target/revision | confirm active personal project without printing tokens; read service; denied non-allowlisted target; promote allowed revision; read routing and fresh health | **ACCESS_REQUIRED** |
| Local fallback target | existing local runtime chosen at P0 | honest fallback if cloud access fails | local target URL in ignored `.env` | genuinely running local process | dispatch, read-back, restart/reset; UI labels “local” | **OFFLINE_READY** (not built) |
| Trigger.dev / Firestore / executor fleet / Auth0 | not installed | future hosted topology | none for MVP | separate reviewed design | none | **DEFERRED** |

OpenAI owner action at P0: use a personal project, set a small agreed budget,
resolve actual model IDs and supported API behavior, cap calls/tokens/retries,
and append a cost record without exposing the key. Coding subscriptions do not
imply API credits.

Slack scope at P0: one visibly opted-in thread. Confirm generated event
subscriptions and only required history/mention/interactivity permissions.
Store platform workspace/user IDs, suppress bot/subtype loops, deduplicate
stable event/delivery IDs, and validate approval against both actor and exact
proposal revision. The inherited button is not authorization.

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
  operator session. Keep them loopback-only during starter verification; before
  any deployment, protect or disable every agent/mutating/paid-call route.

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
2. Official build authority still requires both organizer opening and explicit
   maintainer authorization; the portal deadline must be checked live.
3. Personal OpenAI credits/budget, personal Slack setup, and personal GCP
   project/budget are not live-verified.
4. Dependency reachability/remediation must be resolved before live traffic.
5. The local topology loses availability when the laptop sleeps or disconnects.

Primary sources: organizer portal in PLAN; CopilotKit/Slack/Node/Cloud Run
links in PLAN §6; GitHub advisory URLs are available in the repository Security
tab. Context7 authentication was unavailable during this audit, so no claim is
based on it.
