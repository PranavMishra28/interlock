# Interlock

Interlock is planned to turn one operational decision in an opted-in workspace
into an approved temporary constraint, then observe, perform one authorized
continuation, verify it, and retain evidence.

**Status: PREP_ONLY. Interlock is not implemented.** This public repository
contains an unchanged inherited CopilotKit starter plus generic CI, security,
provenance, and build-day planning. The inherited incident chat is starter
evidence, not an Interlock demo.

Requires Node 22 (`.nvmrc`) and npm 10:

```bash
npm ci --no-audit --no-fund
bash scripts/check.sh
```

The check runs inherited typechecks/tests/MCP verification, builds the web
workspace, validates the committed phase and preparation boundary, runs guard
negative cases, and verifies full-SHA GitHub Action pins. It needs no key or
paid call.

Start/resume with [`AGENTS.md`](AGENTS.md) and
[`docs/TRACKER.md`](docs/TRACKER.md). Architecture and invariants:
[`docs/PLAN.md`](docs/PLAN.md). Readiness and owner actions:
[`docs/READINESS.md`](docs/READINESS.md). Build-day prompts:
[`docs/RUNBOOK.md`](docs/RUNBOOK.md).

Inherited/event ownership is recorded in
[`HACKATHON_PROVENANCE.md`](HACKATHON_PROVENANCE.md). The immutable inherited
import is `79b036635c01d932374bed1013b901283f421096`; the annotated pre-event
baseline tag resolves to `76897ddd227c4d3f06e35063679e7189d075f747`.
Inherited code retains its MIT license in [`LICENSE`](LICENSE).
