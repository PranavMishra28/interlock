# Interlock

Interlock turns an ambient Slack operational decision into one revision-bound,
owner-approved, fail-closed action with independently verified evidence.

Use the [canonical walkthrough](docs/RUNBOOK.md#canonical-private-test-and-recorded-demo-walkthrough)
for the exact synthetic, Control Room, and live Slack test paths. The whole
local path is one command, needs no credential, and stays explicitly synthetic
while using the real coordinator/store flow:

```bash
npm run demo
```

That starts the seeded coordinator and the Control Room on
`http://localhost:3100` together; `Ctrl-C` stops both. `npm run dev` is the
equivalent one command for the credentialed live path.

Status and remaining human gates live in [TRACKER](docs/TRACKER.md). Inherited
starter code remains MIT licensed under [LICENSE](LICENSE); credit:
[CopilotKit Agents Everywhere starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit).
