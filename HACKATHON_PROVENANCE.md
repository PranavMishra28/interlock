# Hackathon provenance

Event: **Agents, Everywhere** (AI Tinkerers global hackathon), September 12, 2026,
America/Los_Angeles. Handbook rule: the submitted project must be net-new and
its core functionality built during the event; templates, libraries, prompts,
and starter code may be reused if the team identifies inherited vs event-built
work. This file is that identification. It is kept current across the event.

## Status: BUILD_ACTIVE

Build authorization: RECORDED
Final pre-build commit: `88b6309b071978fb2ec585b683392a11d5283358`

The maintainer confirmed the official opening and authorized BUILD_ACTIVE at
2026-09-12 10:21 PDT. The immutable pre-build boundary above contains no
Interlock implementation. Event work is recorded below from the transition
commit onward.

## Inherited: CopilotKit starter kit

| Field | Value |
|---|---|
| Upstream | https://github.com/CopilotKit/agents-everywhere-starter-kit |
| Commit | `2622f07d17850ad68bb9a7266c566c1fefc97df4` (main, 2026-09-11T19:00:52Z) |
| License | MIT, Copyright (c) 2026 CopilotKit — `LICENSE` preserved verbatim |
| Imported by | commit `79b036635c01d932374bed1013b901283f421096` (verbatim subset) |
| Package manager | npm workspaces, `package-lock.json` lockfileVersion 3, unchanged |
| Node | `.nvmrc` = 22 (verified with v22.23.1 / npm 10.9.8) |

Every imported file is byte-identical to the upstream blob. Verify:

```bash
git clone https://github.com/CopilotKit/agents-everywhere-starter-kit /tmp/up
diff <(git -C /tmp/up ls-tree -r 2622f07d17850ad68bb9a7266c566c1fefc97df4 | awk '{print $3,$4}' | sort -k2) \
     <(git ls-tree -r 79b036635c01d932374bed1013b901283f421096 | awk '{print $3,$4}' | sort -k2) \
  | grep '^>' && echo "DIFFERS" || echo "all imported blobs identical to upstream"
```

(Lines prefixed `<` are upstream files we did not import; `>` would be a
mismatch.) `bash scripts/scope-audit.sh` checks the working tree against the
same baseline on every CI run.

### Imported paths at the baseline (75 files)

- `package.json`, `package-lock.json`, `.nvmrc`, `.env.example`, `LICENSE`, `.gitignore` (later extended, see below)
- `packages/agent-core/**` — shared agent factory (`BuiltInAgent`), model resolver, prompt, MCP capability wiring
- `apps/web/**` — the selected **web template** (Next.js 15 + CopilotKit React + runtime route)
- `apps/channel-slack/**`, `apps/local-chat/**`, `apps/mcp/**` — other root workspaces; imported because they share the single lockfile (removing them would desync `npm ci`). `apps/channel-slack/**` is the intended Slack transport reference for the planned build; `apps/local-chat/**` and `apps/mcp/**` are not used by the plan.
- `scripts/check-env.sh`, `scripts/dev.sh`, `scripts/verify.sh`, `scripts/verify-mcp.mjs`, `scripts/*.test.*`
- `hackathon-overview.md`, `hackathon-rules.md`, `using-sponsor-tools.md`, `CREDITS.md`, `templates/web.md`, `templates/slack.md`, `dev-docs/*.md`

After PR #7 merged, the unused starter guides above and the unused inherited
web chat/voice/search UI paths were removed. The npm workspaces, lockfile,
license, and this historical import record remain intact.

### Deliberately not imported

`apps/mobile/` and `examples/auth0/` (independent installs with their own
lockfiles), `assets/` (banners, sponsor logos), `dev-docs/channels-sdk-walkthrough/`
(Slack screenshots), `.agents/`, `.claude/`, `.cursor/` (Channels skill and its
editor symlinks; the Slack template is not our path), `.mcp.json` (project-scoped
MCP servers for Claude Code; not installing editor integrations we did not
choose), and upstream `README.md`, `AGENTS.md`, `SUBMISSION.md`,
`.github/workflows/ci.yml`, which this repository replaces with its own.

## Pre-event modifications (bootstrap only, allowlisted in `scripts/scope-audit.sh`)

| Path | Change | Why |
|---|---|---|
| `.gitignore` | appended patterns | every `.env.*` except `.env.example`, key material, service-account JSON, local tool state |
| `.github/workflows/ci.yml` | replaced | inherited workflow used floating `@v4` tags, no timeout/concurrency, and an `examples/auth0` job for code we did not import. New one is SHA-pinned, `contents: read`, PR-safe, telemetry off |
| `.github/dependabot.yml` | new | grouped weekly updates; majors and the CopilotKit/AG-UI pair excluded |
| `.hackathon-phase` | new after the tag | committed fail-closed phase record; no clock/environment unlock |
| `.cursor/hooks.json`, `.cursor/hooks/*.sh` | new after the tag | generic project-local context reminders, dangerous-command gate, and bounded completion check; no product behavior or process resurrection |
| `scripts/check.sh`, `scripts/check-evidence.sh`, `scripts/docs-links.test.mjs`, `scripts/hooks.test.sh`, `scripts/scope-audit.sh`, `scripts/scope-audit.test.sh` | new/revised | one verification entrypoint; tree-bound successful-check evidence; canonical doc-link and hook fixtures; phase-aware preparation freeze/provenance report; disposable negative cases |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `SUBMISSION.md`, `HACKATHON_PROVENANCE.md`, `docs/**` | new/revised | product status/credit, thin inherited-link bridge, prose plan/design, capability DAG, readiness, and build-day runbook |

No inherited application source (`apps/**`, `packages/**`, inherited `scripts/*`,
manifests, lockfile) has been modified. Administrative deviation from the
upstream README: we did not run `npm install`; we ran `npm ci` against the
inherited lockfile. Inherited install/dev scripts were read before running.

## Explicitly NOT implemented before the event

Interlock runtime prompts, executable domain schemas, agents, resource
binding, approval semantics, enforcement, observation, release, verification,
product UI, product-specific fixtures/tests, deployment infrastructure,
Trigger.dev tasks/config, Firestore rules/collections, Cloud Run services,
sponsor integrations beyond what the starter already wires. No such work
exists in ignored files, other branches, stashes, patches, or another repo.

Prior research and `docs/PLAN.md` are planning prose, not proof of
implementation or novelty.

## Not imported from anywhere else

No code from Irrevon, Eonfolk, or any employer repository.

## Preparation after the immutable tag

The annotated tag `pre-event-baseline` remains at
`76897ddd227c4d3f06e35063679e7189d075f747`; it is not moved. A later
pre-opening preparation PR audits and simplifies prose and adds the generic
phase-aware guard. Work after the old tag is therefore **not automatically
event work**.

At P0, after the official opening and explicit maintainer authorization, record
the then-current final PREP_ONLY commit in `.hackathon-phase` and TRACKER. That
commit—not a timestamp and not the old tag alone—is the event boundary.

| Preparation commit / PR | Change | Product core? |
|---|---|---|
| [PR #3](https://github.com/PranavMishra28/interlock/pull/3), merge `72dbc2163abbb86244549afd07461328030aa8e6` (substantive commits `43be666`, `851b745`) | audit, simplified topology prose, tracker/runbook, phase guard and generic negative tests | no |
| [PR #4](https://github.com/PranavMishra28/interlock/pull/4), merge `f14ae7bfce9c5b6cbf6202a5dfc0e62db480fd24` | status-only read-back of PR #3 and remote checks | no |
| [PR #5](https://github.com/PranavMishra28/interlock/pull/5), merge `bf547a37` (commit `1f437bb`) | allow six exact generic harness paths in the PREP_ONLY guard, so the following pull request can pass the trusted base check | no |
| [PR #6](https://github.com/PranavMishra28/interlock/pull/6) | project hooks and fixtures, tree-bound check evidence, guard field-immutability and boundary pinning, product-first README, ambient Slack plan, Control Room design, capability-gated tracker DAG, runbook and readiness | no |

## Event work (fill only during an authorized BUILD_ACTIVE phase)

| Commit range | What was built | Inherited pieces it depends on |
|---|---|---|
| `dc42655` | recorded official opening, maintainer authorization, and immutable final PREP_ONLY boundary; no product behavior | phase guard and preparation documents |
| `bfbcbc4` | deterministic revision-bound workflow and intent boundary; native SQLite sole-owner store; loopback coordinator and exact-target adapter contract; read-only Control Room with visibly synthetic fixture; product and reliability tests | inherited TypeScript workspaces, Node 22 `node:sqlite`, Next.js web app and CSS tokens |
| `87fe0b8` | ambient unmentioned Slack ingress and bounded context persistence; exact-owner/revision approval component and endpoint; Cloud Run v2 adapter contract; Control Room state fixtures/responsive checks; disabled inherited paid/search routes; BUILD_ACTIVE guard-fixture repair | inherited Channels delivery/identity types and durable component API, Next.js routes, Cloud Run REST API |
| `d2b4a64` | security-review repairs: loopback Slack listener; inert `.env` parser; bounded exact-HTTPS Cloud Run reads; factual listener heartbeat; fail-closed coordinator outage state; workspace-bound Slack ingress, approval, and retained provenance | inherited Channels canonical application-user identity, Node HTTP/fetch primitives, SQLite schema migration |
| `e4f6454` | invariant-review repairs: durable unresolved-operation reconciliation without repeat dispatch; effective Cloud Run revision evidence; expired-proposal release; duplicate-clock reset persistence; SQLite-exclusive ownership; ambient proposal tool and exact card-bound approval capability | inherited Channels agent/tool/component lifecycle, Node crypto and SQLite locking, Cloud Run REST read-back |
| `ca2dc7c` | aligned the visibly synthetic intervention fixture with structured wrong-revision/routing evidence and rechecked the rendered Control Room state | event-built Control Room fixture and verification display |
| `5873d84` | inert data-only `.env` parsing, secret-safe doctor output, and a canonical ignored environment example | Node file and string primitives; no shell evaluation of secret-bearing files |
| `cd8e4ff` | pinned the economical model snapshot and configured the managed Channel code | inherited CopilotKit managed Channels credential contract |
| `10556c9` | provisioned the dedicated always-free Cloud Run target and bound the Intelligence project | Google Cloud Run v2 REST API and a named personal gcloud configuration |
| `0abf3b8` | drove the hold from the long-lived coordinator process and posted approvals as registered components so a listener restart re-renders an actionable card | inherited Channels durable registered-component API |
| `a78ea06` | calibrated the clock-skew allowance against the measured live target rather than an assumed ideal clock | event-built observation window |
| `39d07ea` | verified the bounded interpreter against the live model and recorded both findings, including one case pinned to the invariant rather than to an unstable output | OpenAI structured output with strict schemas |
| `01b437b` | stopped the Control Room reporting a connected coordinator it could not reach | event-built snapshot loader |
| `748bd2d` | gave the Control Room a scalable brand mark and an enterprise product shell, with tokens scoped so inherited styling does not drift | inherited CSS tokens preserved; native system typography |
| `de1dbcb` | added the truthful local coordinator demo: real store, coordinator, and supervisor against one in-process synthetic target, with a repeatable reset | event-built domain and persistence; Node HTTP loopback |
| `18da43d` | native typography stacks, layout-stable loading skeletons, response security headers, and the documented cookie-free posture | platform font stacks and Next.js response headers; no remote font or analytics |
| `08b7a82` | required the coordinator's own clock to agree that the hold window elapsed, closing a target-controlled acceleration path, and distinguished a suspended machine from a slow target | event-built observation window and supervisor |
| `01f9c9b` | stopped the Control Room asserting facts it cannot know: distinct coordinator-failure source, reasoned and timestamped connectivity, timestamp-spaced plot with named resets, and an honest no-sample state | event-built snapshot contract; native SVG, no charting dependency |
| `ad6f8c7` | routed the live Slack path through the validated Intent primitive so the tested interpretation is the one the product runs | inherited Channels agent and tool lifecycle |

Evidence-recording commits `c1b8dd0`, `19cf8af`, `bf83fbf`, `0c784c9`, `e7b5527`,
`99468f5`, and `7cf76ef` changed status documents and current-tree check
evidence only; they carry no product behavior.

The event boundary is the `PREBUILD_COMMIT` recorded by the committed P0 phase
transition. `scripts/scope-audit.sh` reports every path changed after it.
