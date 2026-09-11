# Interlock

> **Status: pre-build. Nothing here implements Interlock yet.**
> This repository holds an inherited starter kit plus repository bootstrap
> (CI, security settings, docs, plan) prepared *before* the
> [Agents, Everywhere](https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM)
> hackathon (AI Tinkerers, 2026-09-12). The product described in
> [`docs/PLAN.md`](docs/PLAN.md) will be built during the official build
> period, and this README will be rewritten then.

## What Interlock will be (plan, not a claim)

An ambient operational-control agent for a small on-call team's text
workspace. When a teammate states a decision ("hold the release until checkout
latency is back under 2 s for 15 minutes, then ship it"), Interlock proposes a
typed, scoped **constraint contract**; an authenticated operator approves that
exact revision; a durable workflow enforces it against one controlled action
adapter, observes fresh health samples, performs the approved continuation,
independently verifies the outcome, and retires the constraint while keeping
the evidence trail. It is not a chatbot and not the starter's incident demo
renamed. See the plan for scope, invariants, and rejected alternatives.

## What is here today

| Part | Origin | Notes |
|---|---|---|
| `apps/web`, `packages/agent-core`, other `apps/*`, `scripts/verify*`, `scripts/check-env.sh`, lockfile, hackathon docs | **Inherited**, byte-identical, from [CopilotKit/agents-everywhere-starter-kit](https://github.com/CopilotKit/agents-everywhere-starter-kit) @ `2622f07` (MIT) | Web template selected; other workspaces present only because they share the lockfile |
| `scripts/check.sh`, `scripts/scope-audit.sh`, `.github/`, `SECURITY.md`, `docs/`, `AGENTS.md`, this README | **Ours**, bootstrap only | No product code |

Full accounting: [`HACKATHON_PROVENANCE.md`](HACKATHON_PROVENANCE.md).

## Quickstart (inherited starter, unchanged)

Requires Node 22 (`.nvmrc`) and npm 10.

```bash
git clone https://github.com/PranavMishra28/interlock.git
cd interlock
npm ci                          # exact install from the inherited lockfile
bash scripts/check.sh           # lockfile drift, typecheck, tests, MCP round trip, web build, scope audit, action pins
```

To run the inherited web example locally:

```bash
cp .env.example .env            # set MODEL_PROVIDER=openai, OPENAI_API_KEY, MODEL (your account's model)
npm run check-env
npm run dev:web                 # http://localhost:3100
```

Without an API key the page still renders (sample incident data); chat
requests will fail at the runtime with a clear error. The starter's own docs:
[`templates/web.md`](templates/web.md), [`using-sponsor-tools.md`](using-sponsor-tools.md),
[`dev-docs/`](dev-docs/README.md).

## Repository controls

CI (`.github/workflows/ci.yml`) runs `scripts/check.sh` on every push to
`main` and every pull request with a read-only token, pinned actions, no
secrets, and no deploys. `main` is protected against force-push and deletion
and requires the `verify` check. Secret scanning with push protection,
Dependabot alerts/updates, and private vulnerability reporting are enabled.
Details and read-back evidence: [`docs/READINESS.md`](docs/READINESS.md).

## Documents

- [`docs/PLAN.md`](docs/PLAN.md) — architecture, trust boundaries, invariants, acceptance cases, build sequence
- [`docs/READINESS.md`](docs/READINESS.md) — exact versions, verified commands, sponsor/account readiness matrix, blockers
- [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — judging-criteria evidence checklist, storyboard, draft copy
- [`AGENTS.md`](AGENTS.md) — instructions for coding agents (Cursor/Codex read it; Claude Code via `CLAUDE.md`)

## License

Inherited starter code: MIT, Copyright (c) 2026 CopilotKit ([`LICENSE`](LICENSE), unmodified).
Files added by this repository are also released under the MIT License,
Copyright (c) 2026 Pranav Mishra. No CLA; inherited code is not relicensed.
