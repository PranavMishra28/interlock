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

## Repository controls (read back from GitHub, 2026-09-11 ~12:40 PDT)

Repository: https://github.com/PranavMishra28/interlock (public, created
2026-09-11T19:32:40Z as a **new** repository; no existing private repo was
made public). Default branch `main`.

| Control | Set via | Read-back | State |
|---|---|---|---|
| Dependabot alerts | `PUT /vulnerability-alerts` | `GET` → 204 | enabled |
| Dependabot security updates | `PUT /automated-security-fixes` | `{"enabled":true,"paused":false}` | enabled |
| Dependabot version updates | `.github/dependabot.yml` | workflow "Dependabot Updates" active | enabled (weekly, grouped, majors ignored) |
| Secret scanning | `PATCH security_and_analysis` | `secret_scanning: enabled` | enabled |
| Push protection | same | `secret_scanning_push_protection: enabled` | enabled |
| Non-provider (generic) secret patterns | same | stayed `disabled` after request | **unsupported on this plan/repo** — reported, not bypassed |
| Private vulnerability reporting | `PUT /private-vulnerability-reporting` | `GET` → `true` | enabled |
| Branch protection `main` | `PUT /branches/main/protection` | required check `verify` (strict, app 15368 = GitHub Actions); `allow_force_pushes: false`; `allow_deletions: false`; no PR review requirement; `enforce_admins: false` | enabled |
| Merge settings | `PATCH repo` | `delete_branch_on_merge: true`, `allow_auto_merge: false` | set |

`enforce_admins: false` is deliberate and documented: the solo maintainer keeps
an admin escape hatch for a CI outage during the event; force-push and
deletion remain blocked for everyone. Prefer PRs. Not silently weakened.

### CI evidence

- Run [34639428781](https://github.com/PranavMishra28/interlock/actions/runs/34639428781)
  on `22b56e4b` (push to main): job `verify` **success**, 2 min 11 s. CI
  toolchain: Node **v22.23.2**, npm 10.9.8 (local was v22.23.1; both satisfy
  `.nvmrc` 22). Steps: checkout (pinned) → setup-node (pinned) → `npm ci` →
  `bash scripts/check.sh`.
- Dependabot immediately raised **19 alerts** on inherited transitive deps
  (undici, postcss, qs, @opentelemetry/core) in the unchanged lockfile and
  opened PR #1 "Bump postcss and next", which would move Next.js 15.5 → **16.x
  (major)**. CI on that PR **failed as designed** (`scope-audit` flagged
  `package.json`, `package-lock.json`, and a `tsconfig.json` rewritten by the
  newer Next build). Closed with `@dependabot ignore this major version`.
  Decision: inherited dependency bumps are an explicit event-time team
  decision; nothing is deployed, and the affected packages are build/runtime
  toolchain deps of the starter. Two Dependabot security jobs (qs, undici)
  recorded update errors (transitive deps it could not bump alone).

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

## Pre-event baseline tag

Annotated tag **`pre-event-baseline`** marks the last pre-event commit on
`main` (created after CI was green, branch protection applied, and the
reviews below were repaired). Exact commit: `git rev-list -n1 pre-event-baseline`
or the [tags page](https://github.com/PranavMishra28/interlock/tags). It is not
a product release and will not be moved.

## Reviews (2026-09-11, four separate read-only reviewers with bounded briefs)

Reviewers were separate subagent runs with independent briefs; they did not
see each other's output. Findings and what was done:

| Review | Finding | Action |
|---|---|---|
| Eligibility/provenance | No product implementation on `main`; 0 blob mismatches vs upstream; stash/untracked clean; MIT preserved; no fabricated URLs/benchmarks | none needed |
| Eligibility/provenance | Baseline tag referenced but not yet created; read-back section empty | tag created after repairs; this section filled |
| Eligibility/provenance | `docs/` allowlist could hide code | scope audit now fails on any non-`.md`/`.png` file under `docs/` |
| Eligibility/provenance | Dependabot branch with Next 16 bump | PR #1 closed with `@dependabot ignore this major version`; branch auto-deleted |
| Security/authority | CI: no findings (read-only token, pins, no secrets, no injection) | — |
| Security/authority | Action-pin check reported "pinned" when zero `uses:` lines matched | fails closed now; prints the count |
| Security/authority | Pin check is format-only (any 40-hex SHA passes) | accepted; noted. Dependabot keeps SHAs current |
| Security/authority | AGENTS.md dangerous ops missing `git add -f`, weakening checks/protection, publish commands | added |
| Security/authority | PLAN §3–5 / SECURITY: no model write authority, no capability URLs to browser, no timeout-as-consent, OIDC absence stated honestly | — |
| Compatibility | Scripts portable (GNU/BSD); `node-version-file` + npm cache fine; `fetch-depth: 0` needed and present; PR merge commits work | — |
| Compatibility | Rename of an inherited file into an allowlisted dir could pass | `git diff --no-renames` |
| Compatibility | Allowlist file entries prefix-matched (`check.sh.bak` would pass) | exact match for file entries, prefix only for `dir/` entries |
| Compatibility | Dependabot group lacked `patterns` | `patterns: ["*"]` added |
| Compatibility | `verify-mcp.mjs` 15 s stdio timeout is a low flake risk in CI | noted; inherited |
| Simplicity/judge | Auth0 status BLOCKED vs DEFERRED across docs | DEFERRED everywhere |
| Simplicity/judge | "`@copilotkit/runtime` v2" ambiguous | "1.70.x (`/v2` API)" |
| Simplicity/judge | SUBMISSION pointed acceptance table to the wrong file | points to PLAN §7 |
| Simplicity/judge | README `check.sh` one-liner omitted two stages | aligned |
| Simplicity/judge | First task "transactional" ambiguous; not demo-facing | clarified in PLAN |
| Simplicity/judge | Plan realism: steps 2, 5, 6–7 most likely to blow the day | smallest-honest-cut list added to PLAN |
| Simplicity/judge | Suggested trimming AGENTS.md policy sections / PREP_ONLY repetition | not done: the prompt requires those sections; AGENTS.md is 78 lines |

One repair cycle was needed; all negative tests (rename, sibling file,
zero-`uses`, `docs/x.ts`) re-run and fail as intended. Blockers remaining: none
in the repository; account blockers are listed above.
