# Interlock — agent instructions

## MODE = PREP_ONLY

Interlock is **not implemented** and must not be until the official build
period of *Agents, Everywhere* (2026-09-12, America/Los_Angeles) opens **and**
the maintainer gives a separate build instruction. A later clock alone does not
unlock it. Until then: repository administration, inherited scaffolding,
generic tooling, verification, and planning prose only. No Interlock prompts,
schemas, agents, approval/enforcement logic, product UI, fixtures, or infra,
anywhere (including ignored files, branches, stashes, other repos).

## Source of truth

- Plan: `docs/PLAN.md` · Readiness/versions/blockers: `docs/READINESS.md`
- Provenance (inherited vs ours): `HACKATHON_PROVENANCE.md`
- Event rules: `hackathon-rules.md`, `hackathon-overview.md` (inherited from upstream)
- Selected template: `templates/web.md` · Sponsor setup: `using-sponsor-tools.md`
- Security rules: `SECURITY.md` · Submission checklist: `docs/SUBMISSION.md`

## Verified commands (Node 22.x per `.nvmrc`, npm 10.x)

```bash
npm ci                          # exact install from the inherited lockfile
bash scripts/check.sh           # THE check: lockfile drift, typecheck, tests, MCP, web build, scope audit, action pins
npm run verify                  # inherited subset (typecheck + tests + MCP stdio)
npm run build --workspace web   # web template build
npm run dev:web                 # http://localhost:3100 (needs OPENAI_API_KEY in .env for chat)
bash scripts/scope-audit.sh     # inherited sources unchanged vs baseline 79b03663
```

`npm install` is not the install command; never regenerate `package-lock.json`
without a reviewed reason.

## Repository boundaries

- Inherited from CopilotKit/agents-everywhere-starter-kit@2622f07 (MIT):
  `apps/**`, `packages/**`, inherited `scripts/*`, manifests, lockfile,
  `hackathon-*.md`, `templates/`, `dev-docs/`, `using-sponsor-tools.md`,
  `CREDITS.md`. Do not edit before the event; the scope audit fails if you do.
- Ours: `AGENTS.md`, `CLAUDE.md`, `README.md`, `SECURITY.md`,
  `HACKATHON_PROVENANCE.md`, `docs/`, `.github/`, `scripts/check.sh`,
  `scripts/scope-audit.sh`, `.gitignore` additions.
- Upstream rules still apply to the inherited code: keep `@ag-ui/client`
  deduped via the root `overrides`; bump `@copilotkit/runtime` and
  `@copilotkit/channels` together; `maxSteps` on `BuiltInAgent` must be > 1.

## Dangerous operations — do not

- Force-push, delete branches/tags, rewrite history, move the baseline tag.
- Change global git identity; commit as anyone but the configured repo user.
- Commit `.env*` (except `.env.example`), keys, service-account JSON,
  transcripts, screenshots with private data, or Trigger.dev token URLs.
- Print secret values, dump the environment, or `set -x` around credentials.
- Add deploy/publish steps, `pull_request_target`, secrets, or paid API calls
  to CI. Unpinned actions fail `check.sh`.
- Provision cloud resources, enable billing, change IAM, or create credentials
  without explicit scope/budget approval from the maintainer.
- Use non-personal (employer) accounts or code. No Irrevon/Eonfolk/employer imports.

## Completion checks before you claim done

1. `bash scripts/check.sh` passes locally.
2. `git status` clean; no untracked secrets (`gitleaks detect --no-git` on the tree).
3. CI `verify` check green on the PR/commit.
4. `HACKATHON_PROVENANCE.md` updated if inherited/ours boundary moved.
5. Passing starter tests is not evidence Interlock works. Say what was verified.

## Editors

Cursor and Codex read this file directly. Claude Code reads `CLAUDE.md`, which
imports it. Do not create competing instruction files.
