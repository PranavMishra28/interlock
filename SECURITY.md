# Security

Pre-build status: this repository contains inherited starter scaffolding and
planning documents only. There is no deployed Interlock service yet.

## Reporting

Use GitHub private vulnerability reporting on this repository
(Security tab → Report a vulnerability). Do not open a public issue for a
credential or authorization problem.

## Rules that apply to every commit

- Credentials live only in the ignored root `.env` (or a deployment
  platform's secret store). `.env.example` holds names and placeholders, never
  values. `scripts/check-env.sh` sources `.env` as shell, so treat that file as
  executable configuration.
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
holds write authority; deterministic server code does, after an authenticated
operator approves an exact contract revision.
