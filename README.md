# Interlock

Ambient operational constraints for Slack, with explicit approval and verified
outcomes.

**Status: BUILD_ACTIVE.** The repository now contains the event-built Interlock
coordinator, SQLite store, supervisor, Slack channel application, Control Room,
and a runnable local synthetic rehearsal. The OpenAI interpreter and Cloud Run
target have separate bounded live evidence; Slack remains `ACCESS_REQUIRED`, so
the complete release and recorded demo remain blocked.

Interlock notices an operational decision in one authorized Slack incident
channel, routes an exact temporary hold to the configured owner, enforces one
controlled operation, observes the stated recovery condition, performs only the
approved continuation, verifies the selected target, and retains the receipt.

## Local quickstart

Requires Node 22 (`.nvmrc`) and npm 10:

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
```

The check is offline and secret-free. It verifies the workspaces, Interlock
tests, web build, and repository governance controls. It is not live integration
evidence.

To run the repeatable local rehearsal, start the synthetic coordinator in one
terminal:

```bash
npm run demo --workspace web -- --reset
```

Then start the Control Room in another terminal:

```bash
INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev:web
```

Open `http://localhost:3100`. This path uses the real store, coordinator, and
supervisor against an in-process synthetic target. The snapshot and UI label it
synthetic; it is not evidence of live Slack delivery, OpenAI behavior, or
Cloud Run observation or promotion. Keep it local: unresolved inherited
dependency alerts and unauthenticated starter routes block public exposure.

## Build-day entrypoint

Start/resume with [`AGENTS.md`](AGENTS.md) and
[`docs/TRACKER.md`](docs/TRACKER.md), then use the single kickoff in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md). Product scope and invariants live in
[`docs/PLAN.md`](docs/PLAN.md); Control Room requirements are in
[`docs/DESIGN.md`](docs/DESIGN.md); access and security gates are in
[`docs/READINESS.md`](docs/READINESS.md) and [`SECURITY.md`](SECURITY.md).

Detailed inheritance and event-work boundaries are recorded discreetly in
[`HACKATHON_PROVENANCE.md`](HACKATHON_PROVENANCE.md).

## License

Inherited starter code remains MIT licensed under [`LICENSE`](LICENSE).
Credit: [CopilotKit Agents Everywhere starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit).
