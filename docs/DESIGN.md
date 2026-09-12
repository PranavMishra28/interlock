# Control Room design brief

Status: prose-only PREP_ONLY requirement. Slack is the conversation and
exact-revision approval surface. The Next.js Control Room is evidence; it is
not a Slack imitation, a chat panel, or a source of operator authority.

## Decision

Two compact layouts were considered:

1. **Chronology first:** a full-width event timeline above contract, chart, and
   receipt cards. It tells a story well, but the current hold and next permitted
   action are too easy to miss during a screen recording.
2. **Decision first (selected):** a fixed summary band, a two-column evidence
   body, and a full-width verification receipt. It answers “what is constrained,
   who approved it, what happens next, and is evidence fresh?” without scrolling
   at common laptop and 16:9 recording sizes.

The selected page has three stable regions:

- **Summary band:** active contract and source message reference; target and
  exact candidate revision; configured owner and persisted approval revision;
  explicit current state and next state; Slack listener and local coordinator
  connectivity shown independently.
- **Evidence body:** left, one timestamped health plot with threshold, required
  continuous window, current elapsed duration, reset markers, stale samples,
  and observation gaps; right, a lifecycle rail from source through proposal,
  approval, hold, observation, claim, dispatch, verification, and retirement.
- **Receipt:** expected versus observed target revision, effective routing,
  fresh health, operation identity, final state, and retained evidence time.
  A mismatch stays visibly failed or needs intervention.

## Information behavior

The page reads real coordinator data when built. The browser never reads the
SQLite file. An unavailable listener, sleeping/disconnected coordinator, stale
sample, or coverage gap is shown as unavailable/stale/gap—not inferred as
healthy. Connectivity is factual and timestamped; there is no perpetually green
status dot.

Fixed delay, sustained-health window, and workflow expiry use distinct labels.
For the MVP the health plot represents only the supported sustained-health
condition. “Hold v42 until checkout is healthy for the stated window, then
promote v42” must display target, threshold, elapsed window, and exact revision
without collapsing them into a countdown.

Any demo-only health input or reset control is server-authenticated, disabled
outside an explicit test mode, and labeled **TEST INPUT — SYNTHETIC** beside the
control and resulting samples. It cannot create Slack approval or satisfy a live
Cloud Run criterion.

## Visual system

Preserve the inherited CSS tokens and component styling. After BUILD_ACTIVE,
Recharts and a small useful icon set are the maximum optional additions; first
try native SVG/CSS and existing packages. Do not migrate to Tailwind, add a graph
editor, or draw a decorative network map.

- Typography: one clear page title, compact labels, tabular/monospace timestamps
  and operation IDs, and body text readable at screen-recording scale.
- Color: neutral surfaces; semantic color only for held, observing, verified,
  stale, failed, and intervention states. Never rely on color alone.
- Stability: fixed card dimensions, reserved loading space, and no reflow when
  samples arrive. Motion is optional, restrained, and removed under
  `prefers-reduced-motion`.
- Access: semantic headings/landmarks, logical keyboard order, visible focus,
  descriptive control names, and no hover-only information.
- Chart alternative: adjacent text states threshold, required window, current
  elapsed time, last sample time, gap/reset count, and latest value. Screen
  readers do not need to decode the plot.

## Required states and checks

Design and browser tests cover loading, no active contract, listener offline,
coordinator offline, empty observations, stale evidence, a gap/reset, active
hold, awaiting owner, unauthorized interaction, verification mismatch,
intervention, and retired receipt. The lifecycle rail and receipt must remain
usable at narrow laptop widths and browser zoom.

During development, inspect the page at each vertical-slice milestone with
keyboard navigation, reduced motion, laptop and recording viewports, and a
visual screenshot. Playwright checks semantics and stable state rendering;
human visual inspection checks hierarchy, clipping, chart legibility, honest
failure states, and whether the current/next action is understood immediately.
