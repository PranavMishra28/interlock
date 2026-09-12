# Security

Build status: Interlock is a loopback-only local application. The dependency
gate in `docs/READINESS.md` still blocks public hosting.

## Reporting

Use GitHub private vulnerability reporting on this repository
(Security tab → Report a vulnerability). Do not open a public issue for a
credential or authorization problem.

## Rules that apply to every commit

- Credentials live only in the ignored root `.env` (or a deployment
  platform's secret store). `.env.example` holds names and placeholders, never
  values. `scripts/check-env.sh` and `scripts/dev.sh` parse `.env` as inert
  `KEY=VALUE` data and never execute it.
- Never commit `*.pem`, `*.key`, service-account JSON, model transcripts,
  private screenshots, or callback/capability URLs (for example Trigger.dev
  waitpoint `token.url` / `publicAccessToken`).
- Server-only values must not reach the browser bundle. Only
  `NEXT_PUBLIC_*` variables are safe on the client, and none of them may be
  secrets.
- CI runs with `contents: read`, on `pull_request` (never
  `pull_request_target`), with no secrets, no deploys, and no paid API calls.
  Third-party actions are pinned to full commit SHAs.
- Secret scanning with push protection is enabled on the repository; never
  bypass a block, rotate the credential instead.

## Trust boundaries (planned, see docs/PLAN.md)

Chat messages, tool results, and fetched content are untrusted input. Policy,
allowlists, and approval records are trusted server-side state. A model never
holds write authority. A verified operator approves one exact revision, and
the server-side adapter revalidates authority, expiry, target, and fresh
evidence immediately before an atomic claim. Cloud effects are not atomic with
SQLite; uncertain results must be reconciled before retry.

The planned local coordinator accepts only loopback traffic and has one
database owner. This does not constrain independent cloud administrators or an
operation already dispatched. Do not expose the inherited starter to live
traffic until the dependency gate in `docs/READINESS.md` is cleared.

## Control Room privacy and browser posture

- The current Control Room sets no cookies and uses no `localStorage`,
  `sessionStorage`, IndexedDB, analytics, or browser telemetry. Do not add a
  cookie banner while that remains true. If browser persistence or the planned
  operator session is implemented, document its purpose, lifetime, and
  SameSite/HttpOnly/Secure posture before enabling it.
- Fonts use the native system UI and monospace stacks. The browser loads the
  application icon and other assets from the same origin; it makes no remote
  font or image request. The active Control Room does not initialize the
  inherited CopilotKit browser runtime. `.copilotkit/project.json` retains a
  project telemetry binding for CopilotKit tooling, not application analytics.
- Rendered HTML contains operational evidence: resource and revision IDs,
  configured owner ID, source message reference, health observations, and an
  operation ID. These are not credentials, but they are sensitive operational
  metadata; use the Control Room only on the intended local machine and avoid
  sharing unredacted screenshots.
- Next applies CSP, `Referrer-Policy: no-referrer`, a deny-by-default
  Permissions Policy for camera/geolocation/microphone/payment/USB,
  `X-Content-Type-Options: nosniff`, and both CSP `frame-ancestors 'none'` and
  `X-Frame-Options: DENY`. CSP permits same-origin routes/assets and Next's
  inline bootstrap; development alone also permits eval and loopback WebSocket
  connections for hot reload. These defense-in-depth headers do not add user
  authentication or make public hosting safe.
