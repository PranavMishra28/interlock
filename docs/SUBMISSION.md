# Submission checklist (draft)

Nothing is submitted or published. The live
[portal](https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM) controls the
deadline and organizer instructions.

## Provenance

Inherited: [CopilotKit/agents-everywhere-starter-kit](https://github.com/CopilotKit/agents-everywhere-starter-kit)
at `2622f07d17850ad68bb9a7266c566c1fefc97df4` (MIT), imported at
`79b036635c01d932374bed1013b901283f421096`. The web and Slack examples,
agent factory, sample incident, and inherited tests are not event work.

Event contribution through the current implementation checkpoint is
`dc42655^..ad6f8c7`. It includes the deterministic workflow, sole-owner SQLite
coordinator, supervisor, ambient Slack ingress and approval boundary, bounded
intent contract and live evaluation harness, Cloud Run adapter and live target
exercise, Control Room, and local synthetic rehearsal. See the Event work table
in `HACKATHON_PROVENANCE.md` for the immutable boundary and earlier commit
ledger. Never describe planning prose, starter behavior, an approval click, or
synthetic rehearsal evidence as live Interlock functionality.

## Criterion-to-evidence checklist

| Official criterion | Required visible evidence | Status |
|---|---|---|
| Core Requirements & Functionality | the authorized Slack channel and real Cloud Run target complete the bounded loop; any fallback remains separately labeled | implementation passes; Cloud Run is live-verified; complete loop blocked on Slack access |
| Innovation & Theme Alignment | conversation/page context materially resolves the decision; context-removal case abstains | deterministic evaluation passes; bounded live model evaluation passed 9/9 on three consecutive runs |
| Technical Execution & Integration | hold refuses the operation; interrupted recovery resets; uncertain/wrong-revision behavior stays failed; target is read back | offline integration/reliability tests pass; live Cloud Run refusal, recovery, one promotion, and independent read-back verified |
| Usefulness & Agentic Experience | the trusted configured owner approves the exact revision, sees timestamps/state, and retains an auditable receipt | offline authority/UI states pass; live Slack delivery and approval remain `ACCESS_REQUIRED` |

- [ ] Every claim maps to a test, receipt, live read-back, or video timestamp.
- [ ] Inherited, event-built, fake, synthetic, local, and cloud behavior are
  labeled.
- [ ] Dependency security gate cleared for every live process.
- [ ] Fresh clone and `bash scripts/check.sh` pass at submitted HEAD; CI green.
- [ ] No secret, transcript, private screenshot, callback URL, or employer data.
- [ ] Event work table and known limitations are complete.
- [ ] Video/social URLs are real before insertion.
- [ ] Human explicitly authorizes publication and submission.

The private test and recording must follow the same
[canonical walkthrough](RUNBOOK.md#canonical-private-test-and-recorded-demo-walkthrough).
Recording adds capture only. `.interlock/walkthrough-notes.md` is the sole
confidential operator artifact; it remains ignored, off-screen, and unsubmitted.
Before capture, hide `.env`, tokens, capability URLs, private Slack history,
terminal history, browser developer tools/network panels, unrelated
notifications, and personal account selectors. A missing live Slack gate blocks
the integrated recording rather than authorizing synthetic substitution.

## Demo storyboard (≤120 seconds)

1. **0:00–0:15 — context.** Show the prepared target and one ordinary
   unmentioned message in the authorized Slack incident channel. Explain Intent
   and trusted Scope; the Control Room must say coordinator data, not synthetic.
2. **0:15–0:35 — proposal and identity.** A decision yields a bounded proposal;
   the trusted configured owner approves the exact revision with its button
   (Authority).
3. **0:35–0:55 — enforced hold.** Attempt the controlled promotion and show the
   server adapter refusing it (Enforcement).
4. **0:55–1:15 — interrupted recovery.** Show fresh samples, interrupt one, and
   visibly reset the shortened labeled window (Evidence).
5. **1:15–1:38 — authorized continuation.** Recovery holds; exactly one claim
   promotes the prepared revision on the real selected target.
6. **1:38–1:52 — verification.** Read back intended revision, effective
   routing, and fresh health; a failed check must remain failed.
7. **1:52–2:00 — receipt and provenance.** Show retired active hold, retained
   correlated receipt (Closure), inherited starter credit, and honest
   limitations.

## Draft placeholders

- Project title: **Interlock**
- Planned-use sentence: Interlock turns one operational decision in a single
  administrator-authorized Slack incident channel into an approved temporary
  constraint, then observes, performs one authorized continuation, verifies it,
  and retains evidence.
- Public repository: https://github.com/PranavMishra28/interlock
- Description: Ambient operational constraints for Slack, with explicit
  approval and verified outcomes.
- Event-built files/commits through the current implementation checkpoint:
  `dc42655^..ad6f8c7`; the immutable boundary is recorded in
  `HACKATHON_PROVENANCE.md`
- Surface/target: one authorized Slack incident channel / one event-created
  Cloud Run revision; Cloud Run is live-verified, while Slack is not
- Known limitations: Slack remains `ACCESS_REQUIRED`, so RELEASE-1 and DEMO-1
  remain blocked; the local rehearsal is synthetic and proves no external
  integration; dependency alerts still block public exposure; the coordinator
  is single-machine and Node SQLite is experimental.
- Demo video URL: _none_
- Social post text/URL: _none_

## Cleanup evidence

Record stopped processes, revoked sessions/keys, Slack removal if applicable,
personal Cloud Run teardown or retained-cost approval, routing state, local
secret removal, and confirmation that no unintended public endpoint remains.
