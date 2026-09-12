# Interlock agent map

## Phase

Read `.hackathon-phase` and `docs/TRACKER.md` before acting. Current phase is
**BUILD_ACTIVE**. The official opening, explicit maintainer authorization, and
final clean PREP_ONLY boundary are recorded in the committed phase transition.
Implement only eligible TRACKER nodes within PLAN, READINESS, account, and
spending limits. Missing external access blocks only its dependent live column;
it never authorizes a fallback to masquerade as live evidence.

## Canonical documents

- Status/next action: `docs/TRACKER.md`
- Product/topology/invariants: `docs/PLAN.md`
- Control Room requirements: `docs/DESIGN.md`
- Versions/access/risks: `docs/READINESS.md`
- Build-day prompts/run/reset: `docs/RUNBOOK.md`
- Inherited vs event work: `HACKATHON_PROVENANCE.md`
- Submission evidence: `docs/SUBMISSION.md`
- Security: `SECURITY.md`

Old assistant summaries are not authority. On resume, read this file, TRACKER,
relevant PLAN sections, and actual Git state. One lead writes shared status;
reviewers return findings only.

Project hooks are reminders and deterministic command gates, not a sandbox or
crash recovery. Resume a stopped process through the supported IDE/CLI session
mechanism and re-read repository evidence.

## Boundaries

- Inherited import: commit `79b036635c01d932374bed1013b901283f421096`
  from CopilotKit starter `2622f07d17850ad68bb9a7266c566c1fefc97df4`.
  Keep its license, npm workspaces, lockfile, root `@ag-ui/client` override, and
  compatible CopilotKit package family.
- Never move/delete `pre-event-baseline`, rewrite history, force-push, weaken
  checks/protection, bypass a secret block, or discard unrelated work.
- Never change global Git/editor configuration or invent a Git identity. Use
  the configured personal identity; if absent, stop.
- No employer accounts/code, cloud provisioning, billing, IAM changes, public
  endpoints, app installs, paid calls, package publishing, deploy workflows,
  `pull_request_target`, or CI secrets without explicit scope authorization.
- Never print secrets, dump the environment, use `set -x` around credentials,
  commit `.env`/keys/transcripts/private screenshots/capability URLs, or use
  `git add -f` to bypass ignores.

## Commands

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
npm run verify
npm run build --workspace web
bash scripts/scope-audit.sh
```

`npm ci` is the install command. Do not regenerate the inherited lockfile
without a reviewed, documented security/compatibility reason.

Before completion: update TRACKER, run `bash scripts/check.sh`, scan tracked
history and non-generated artifacts for secrets, verify a clean status, and
require green remote `verify`. Passing starter checks is not proof Interlock
works.

Cursor/Codex read this file; Claude Code reads the thin `CLAUDE.md` import.
