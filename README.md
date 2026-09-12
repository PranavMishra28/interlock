# Interlock

Interlock turns an ambient Slack operational decision into one revision-bound,
owner-approved, fail-closed action with independently verified evidence.

Use the [canonical walkthrough](docs/RUNBOOK.md#canonical-private-test-and-recorded-demo-walkthrough)
for the exact synthetic, Control Room, and live Slack test paths. The repeatable
local path starts with `npm run walkthrough`; it stays explicitly synthetic and
uses the real coordinator/store flow.

Status and remaining human gates live in [TRACKER](docs/TRACKER.md). Inherited
starter code remains MIT licensed under [LICENSE](LICENSE); credit:
[CopilotKit Agents Everywhere starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit).
