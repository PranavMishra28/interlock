# Submission checklist (draft)

Nothing is submitted or published. The live
[portal](https://sf.aitinkerers.org/hackathons/h_XWWQL5eKfJM) controls the
deadline and organizer instructions.

## Provenance

Inherited: [CopilotKit/agents-everywhere-starter-kit](https://github.com/CopilotKit/agents-everywhere-starter-kit)
at `2622f07d17850ad68bb9a7266c566c1fefc97df4` (MIT), imported at
`79b036635c01d932374bed1013b901283f421096`. The web and Slack examples,
agent factory, sample incident, and inherited tests are not event work.

Event contribution: commits `bfbcbc4..87fe0b8` build the deterministic
workflow, sole-owner SQLite coordinator, ambient Slack ingress and approval
boundary, bounded intent contract, Cloud Run adapter contract, and Control
Room. See the Event work table in `HACKATHON_PROVENANCE.md`. Never
describe planning prose, starter behavior, or an approval click as implemented
Interlock functionality.

## Criterion-to-evidence checklist

| Official criterion | Required visible evidence | Status |
|---|---|---|
| Core Requirements & Functionality | the authorized Slack channel and real Cloud Run target complete the bounded loop; any fallback remains separately labeled | offline implementation passes; live blocked |
| Innovation & Theme Alignment | conversation/page context materially resolves the decision; context-removal case abstains | deterministic eval passes; live model blocked |
| Technical Execution & Integration | hold refuses the operation; interrupted recovery resets; uncertain/wrong-revision behavior stays failed; target is read back | offline integration/reliability tests pass; live target blocked |
| Usefulness & Agentic Experience | the trusted configured owner approves the exact revision, sees timestamps/state, and retains an auditable receipt | offline authority/UI states pass; live Slack blocked |

- [ ] Every claim maps to a test, receipt, live read-back, or video timestamp.
- [ ] Inherited, event-built, fake, synthetic, local, and cloud behavior are
  labeled.
- [ ] Dependency security gate cleared for every live process.
- [ ] Fresh clone and `bash scripts/check.sh` pass at submitted HEAD; CI green.
- [ ] No secret, transcript, private screenshot, callback URL, or employer data.
- [ ] Event work table and known limitations are complete.
- [ ] Video/social URLs are real before insertion.
- [ ] Human explicitly authorizes publication and submission.

## Demo storyboard (≤120 seconds)

1. **0:00–0:15 — context.** Show an ordinary unmentioned message in the one
   authorized Slack incident channel, the prepared target, and synthetic
   incident label. Explain what bounded context resolves.
2. **0:15–0:35 — proposal and identity.** A decision yields a bounded proposal;
   the trusted configured owner approves the exact revision with its button.
3. **0:35–0:55 — enforced hold.** Attempt the controlled promotion and show the
   server adapter refusing it.
4. **0:55–1:15 — interrupted recovery.** Show fresh samples, interrupt one, and
   visibly reset the shortened labeled window.
5. **1:15–1:38 — authorized continuation.** Recovery holds; exactly one claim
   promotes the prepared revision on the real selected target.
6. **1:38–1:52 — verification.** Read back intended revision, effective
   routing, and fresh health; a failed check must remain failed.
7. **1:52–2:00 — receipt and provenance.** Show retired active hold, retained
   correlated receipt, inherited starter credit, and honest limitations.

## Draft placeholders

- Project title: **Interlock**
- Planned-use sentence: Interlock turns one operational decision in a single
  administrator-authorized Slack incident channel into an approved temporary
  constraint, then observes, performs one authorized continuation, verifies it,
  and retains evidence.
- Public repository: https://github.com/PranavMishra28/interlock
- Description: Ambient operational constraints for Slack, with explicit
  approval and verified outcomes.
- Event-built files/commits: `dc42655..87fe0b8`; detailed in
  `HACKATHON_PROVENANCE.md`
- Planned surface/target: one authorized Slack incident channel / one
  event-created Cloud Run revision; neither is live-verified
- Known limitations: live Slack, OpenAI, and GCP checks are blocked on personal
  access and explicit spending limits; dependency alerts still block public
  exposure; the coordinator is single-machine and Node SQLite is experimental.
- Demo video URL: _none_
- Social post text/URL: _none_

## Cleanup evidence

Record stopped processes, revoked sessions/keys, Slack removal if applicable,
personal Cloud Run teardown or retained-cost approval, routing state, local
secret removal, and confirmation that no unintended public endpoint remains.
