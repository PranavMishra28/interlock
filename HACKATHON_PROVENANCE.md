# Hackathon provenance

Event: **Agents, Everywhere** (AI Tinkerers global hackathon), September 12, 2026,
America/Los_Angeles. Handbook rule: the submitted project must be net-new and
its core functionality built during the event; templates, libraries, prompts,
and starter code may be reused if the team identifies inherited vs event-built
work. This file is that identification. It is kept current across the event.

## Status: PREP_ONLY (as of 2026-09-11)

Nothing in this repository implements Interlock. Everything here is either
verbatim inherited starter code or generic repository bootstrap (CI, docs,
audit script). Implementation begins only after the official build period
opens and a separate instruction is given.

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

### Imported paths (75 files)

- `package.json`, `package-lock.json`, `.nvmrc`, `.env.example`, `LICENSE`, `.gitignore` (later extended, see below)
- `packages/agent-core/**` — shared agent factory (`BuiltInAgent`), model resolver, prompt, MCP capability wiring
- `apps/web/**` — the selected **web template** (Next.js 15 + CopilotKit React + runtime route)
- `apps/channel-slack/**`, `apps/local-chat/**`, `apps/mcp/**` — other root workspaces; imported because they share the single lockfile (removing them would desync `npm ci`). Not used by the plan.
- `scripts/check-env.sh`, `scripts/dev.sh`, `scripts/verify.sh`, `scripts/verify-mcp.mjs`, `scripts/*.test.*`
- `hackathon-overview.md`, `hackathon-rules.md`, `using-sponsor-tools.md`, `CREDITS.md`, `templates/web.md`, `templates/slack.md`, `dev-docs/*.md`

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
| `scripts/check.sh`, `scripts/scope-audit.sh` | new | one verification entrypoint; baseline drift detection |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `HACKATHON_PROVENANCE.md`, `docs/**` | new | this repository's own documentation and plan |

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

## Event work (fill in during the official build period)

| Commit range | What was built | Inherited pieces it depends on |
|---|---|---|
| _empty until the event_ | | |

Pre-event baseline tag: see `docs/READINESS.md` for the exact tag and commit.
