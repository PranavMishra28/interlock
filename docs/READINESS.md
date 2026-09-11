# Readiness (PREP_ONLY, recorded 2026-09-11, America/Los_Angeles)

Everything below was observed on the maintainer's machine or read back from
GitHub. Items marked BLOCKED/DEFERRED need a human action; nothing was worked
around. Passing starter checks is **not** evidence that Interlock works —
Interlock does not exist yet.

## Toolchain (observed)

| Tool | Version | Source |
|---|---|---|
| Node.js | v22.23.1 (matches `.nvmrc` = 22, `engines.node >=22`) | nvm; also 20.20.2 / 24.18.0 installed, not used |
| npm | 10.9.8 | bundled |
| git | 2.55.0 | Homebrew |
| GitHub CLI | 2.96.0, authenticated as `PranavMishra28` (scopes: gist, read:org, read:packages, repo, workflow) | keyring |
| gitleaks | installed (`/opt/homebrew/bin/gitleaks`) | used for pre-push scan |
| gcloud | Google Cloud SDK 558.0.0 | see Google Cloud row below |
| Trigger.dev CLI | not installed | see Trigger.dev row |

Git author for this repo: the already-configured global identity
(`Pranav Mishra <mishrapranav82@gmail.com>`), personal. No global or local
identity changes were made.

## Inherited dependency versions (from the unchanged lockfile, `npm ci`)

| Package | Installed |
|---|---|
| next | 15.5.25 (Next reports 16.3.5 available; **not** upgraded — reviewed decision, see below) |
| react / react-dom | 19.2.8 |
| typescript | 5.9.3 |
| tsx | 4.23.13 |
| @copilotkit/runtime | 1.70.3 |
| @copilotkit/react-core | 1.70.1 |
| @copilotkit/channels | 0.9.2 (Slack workspace only, unused by plan) |
| @ag-ui/client | 0.0.59 (deduped via root `overrides`, verified with `npm ls`) |
| @ai-sdk/openai | 3.0.109 |
| @openai/agents | 0.17.2 (voice page only, unused by plan) |
| zod | 4.5.4 |
| @modelcontextprotocol/sdk | 1.30.0 |

Upgrade policy: no major upgrades before the event. Next 16 would be a major
(Turbopack default changes, `next lint` removal); the inherited 15.5.x builds
cleanly. Dependabot ignores majors and the CopilotKit/AG-UI pair.

## Verified commands and results (2026-09-11, local, no credentials)

| Command | Result | Time |
|---|---|---|
| `npm ci --no-audit --no-fund` | 1300 packages, lockfile unchanged (`git diff --quiet package-lock.json` ✓) | 11 s |
| `npm run verify` (inherited) | typecheck all workspaces ✓ · tests: scripts 2 files + channel-slack + web 9 tests, all pass ✓ · MCP stdio round trip ✓ | 33 s |
| `npm run build --workspace web` | ✓ compiled; 7 static pages; one inherited warning (`@ai-sdk/google-vertex` dynamic require via `@copilotkit/runtime`) | 36 s |
| `bash scripts/check.sh` | ✓ all five stages (lockfile, verify, build, scope audit, action pins) | 54 s |
| `bash scripts/scope-audit.sh` negative test (edit `apps/web/next.config.ts`) | ✗ exit 1, path reported — detection works; edit reverted | — |
| Action-pin negative test (`actions/checkout@v4`) | detected as unpinned | — |

No formatter/linter is inherited (no eslint/prettier in the lockfile). Adding
one is a lockfile change → deferred as a reviewed decision. TypeScript
`strict` typecheck is the static check.

### Browser inspection of the unchanged starter (inherited starter evidence)

`npm run dev:web` (Next 15.5.25, Turbopack, port 3100), Cursor's built-in
browser, 2026-09-11 12:19–12:21 PDT. Process started and stopped by the agent.

- **Without any `.env`:** page renders (sample incidents INC-1042/1043,
  follow-ups, chat panel). `GET /api/copilotkit/info` → 500
  `OPENAI_API_KEY is required for openai` (expected); the client then falls
  back to a single-route `POST /api/copilotkit` → 404, producing **one console
  error** ("Runtime info request failed with status 404 …"). This is a
  consequence of the missing credential, not a starter defect.
- **With a placeholder key in the process environment only** (no network
  call made, no chat sent): `/api/copilotkit/info` → 200 (`BuiltInAgent`,
  tools + interrupts supported, `mode: sse`), `GET /api/copilotkit/threads` →
  200, suggestions rendered, **zero failed resources, zero dev-overlay
  issues**. Screenshot: `docs/evidence/inherited-starter-web-2026-09-11.png`
  (inherited starter, sample data, no private information).
- Not verified: a real model round trip (no personal key present).

## Sponsor / account readiness matrix

Legend: INSTALLED (package present in lockfile) · CONFIGURED (env names known
and documented) · AUTHENTICATED (personal account verified read-only) ·
TEMPLATE_VERIFIED (inherited path exercised offline) · DEFERRED (allowed later,
not started) · BLOCKED (needs human action). **None of these means Interlock
is integrated.**

| Sponsor / platform | Package · version | Purpose in plan | Credential names | Personal account / project | Entitlement | Safe test performed | Observed result | State | Remaining human action |
|---|---|---|---|---|---|---|---|---|---|
| OpenAI | via `@copilotkit/runtime` 1.70.3 → `@ai-sdk/openai` 3.0.109 (inherited) | both model roles (intent/contract agent, verifier) | `OPENAI_API_KEY`, `MODEL`, `MODEL_PROVIDER=openai` | unknown — no key in shell env | event credits: redemption not published in handbook as of 2026-09-11 (see `CREDITS.md`) | env presence check only (`OPENAI_API_KEY`: unset). No API call. | key absent | **BLOCKED** | Redeem organizer credits in a **personal** OpenAI org/project; create a server-side key; at the event run `GET /v1/models` (read-only) and pick two models from the list; put the key in ignored `.env` only |
| CopilotKit | `@copilotkit/react-core` 1.70.1, `@copilotkit/runtime` 1.70.3 (inherited) | page context, frontend tools, generative UI, HITL interrupts, agent runtime | none for the web template | not required | free for web template | offline: typecheck, tests, build, `/api/copilotkit/info` with placeholder key | runtime reports tools + interrupts capability; UI renders | **TEMPLATE_VERIFIED** | none before event |
| Trigger.dev | `@trigger.dev/sdk` **not installed** (registry latest 4.5.16, Node ≥18.20) | durable workflow: approval waitpoints, observation loop, retries, continuation | `TRIGGER_SECRET_KEY` (server), `TRIGGER_PROJECT_REF` (config), `INTERLOCK_WORKER_SA_KEY` + `INTERLOCK_EXECUTOR_URL` (worker env) | none — `~/.trigger` absent, no login | free tier assumed; unverified | registry version lookup only; docs verified: `wait.createToken` returns capability `url` + `publicAccessToken`; idempotency keys on waits | not logged in | **DEFERRED** (adding SDK/config is event work; account login is human) | `npx trigger.dev@4.5.16 login` (browser flow), create project in personal account, note `TRIGGER_PROJECT_REF` |
| Google Cloud (Firestore, Cloud Run) | `@google-cloud/firestore` 9.1.0 / `google-auth-library` 11.0.2 / `@google-cloud/run` 4.1.0 **not installed** | authoritative records; executor + demo target | none in repo; runtime identities are service accounts (ADC); worker uses `INTERLOCK_WORKER_SA_KEY` | **none personal**: local `gcloud` is authenticated only with a non-personal (employer) account and project, which must not be used | unknown for a personal project | `gcloud auth list`, `gcloud config list` (read-only). No project/API/billing calls made against the employer project. | no personal account authenticated; ADC file exists but belongs to the employer identity | **BLOCKED** | `gcloud config configurations create interlock && gcloud auth login <personal gmail>` in that named configuration; create/select a personal project with billing; enable Run, Firestore, IAM APIs — **all at/after the event with explicit budget approval** |
| Auth0 (optional sponsor, chosen auth path) | `@auth0/nextjs-auth0` 4.29.0 **not installed** | operator login → revision-bound approval identity | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`, `OPERATOR_ALLOWLIST` | none | free tier | none | — | **DEFERRED** | create personal tenant + Regular Web App at the event; fallback is Cloud Run IAP |

Not in scope / not checked: OpenRouter, Exa, Ambiguous AI (starter sponsors not
used by the plan; their env names remain in the inherited `.env.example`).

## Repository controls (read back from GitHub)

_Filled in after repository creation; see the "Read-back" section below._

## Access blockers requiring a human

1. Personal OpenAI API key (and event credit redemption) — nothing model-related can be verified without it.
2. Personal Google account in a **named** gcloud configuration; personal project with billing. The employer configuration must stay untouched and unused.
3. Trigger.dev login + project (interactive).
4. Auth0 tenant (or decision to use IAP).
5. Organizer clarification (unresolved): whether pre-event cloud provisioning would count against "core functionality built during the event". Treated as **not allowed** until clarified; all provisioning is planned for the event.

## Safe resumption

```bash
git clone https://github.com/PranavMishra28/interlock.git && cd interlock
nvm use            # 22
npm ci && bash scripts/check.sh
cat AGENTS.md docs/PLAN.md HACKATHON_PROVENANCE.md
```

Build mode requires: official build period open (America/Los_Angeles) **and**
an explicit maintainer instruction. First event commit: extend the allowlist
in `scripts/scope-audit.sh` and add the start entry to
`HACKATHON_PROVENANCE.md`.

## Read-back (repository settings, CI, tag)

_Populated below once observed._
