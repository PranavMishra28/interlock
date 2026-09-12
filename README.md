# Interlock

Ambient operational constraints for Slack, with explicit approval and verified
outcomes.

**Pre-build status: planned, not implemented.** The runnable web and Slack
examples here are inherited CopilotKit starter code, not an Interlock demo.

Interlock is planned to notice an operational decision in one authorized Slack
incident channel, route an exact temporary hold to the configured owner, enforce
one controlled operation, observe the stated recovery condition, perform only
the approved continuation, verify the real target, and retain the receipt.

## Starter quickstart

Requires Node 22 (`.nvmrc`) and npm 10:

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
```

The check is offline and secret-free. It verifies the inherited workspaces and
web build plus the repository phase, CI, and developer-harness controls.

To run the inherited web example locally:

```bash
cp .env.example .env
# Set a personal model provider/key in .env.
npm run dev:web
```

Open `http://localhost:3100`. Keep it local: unresolved inherited dependency
alerts and unauthenticated starter routes block public exposure.

## Build-day entrypoint

Start/resume with [`AGENTS.md`](AGENTS.md) and
[`docs/TRACKER.md`](docs/TRACKER.md), then use the single kickoff in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md). Product scope and invariants live in
[`docs/PLAN.md`](docs/PLAN.md); the planned Control Room is in
[`docs/DESIGN.md`](docs/DESIGN.md); access and security gates are in
[`docs/READINESS.md`](docs/READINESS.md) and [`SECURITY.md`](SECURITY.md).

Detailed inheritance and event-work boundaries are recorded discreetly in
[`HACKATHON_PROVENANCE.md`](HACKATHON_PROVENANCE.md).

## License

Inherited starter code remains MIT licensed under [`LICENSE`](LICENSE).
Credit: [CopilotKit Agents Everywhere starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit).
