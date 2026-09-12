import assert from "node:assert/strict";
import test from "node:test";
import {
  InterlockError,
  approve,
  claim,
  createWorkflow,
  markDispatchUncertain,
  MAX_CLOCK_SKEW_MS,
  observe,
  promotionAllowed,
  resetObservation,
  verify,
  type Contract,
  type TrustedResource,
} from "./interlock";

const trusted: TrustedResource = {
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "v42",
  ownerId: "U-OWNER",
};

const contract: Contract = {
  id: "hold-42",
  revision: 3,
  sourceDeliveryId: "delivery-1",
  sourceMessageRef: "C-INCIDENT:1710000.0001",
  ...trusted,
  threshold: 1,
  windowMs: 1_000,
  maxSampleAgeMs: 250,
  maxSampleGapMs: 600,
  proposalExpiresAt: 10_000,
};

function code(fn: () => unknown, expected: string) {
  assert.throws(fn, (error) => error instanceof InterlockError && error.code === expected);
}

test("exact owner and revision activate a fail-closed hold", () => {
  const proposal = createWorkflow(contract, trusted);
  code(() => approve(proposal, "U-JUNIOR", 3, 100), "UNAUTHORIZED");
  code(() => approve(proposal, "U-OWNER", 2, 100), "STALE_APPROVAL");
  code(() => approve(proposal, "U-OWNER", 3, 10_001), "PROPOSAL_EXPIRED");

  const active = approve(proposal, "U-OWNER", 3, 100);
  assert.equal(active.status, "ACTIVE_HOLD");
  assert.equal(promotionAllowed(active), false);
});

test("fresh elapsed evidence resets on unhealthy, stale, gap, clock, and restart", () => {
  let state = approve(createWorkflow(contract, trusted), "U-OWNER", 3, 100);
  state = observe(state, 0.5, 200, 220);
  assert.equal(state.status, "OBSERVING");
  state = observe(state, 2, 500, 510);
  assert.equal(state.status, "ACTIVE_HOLD");
  assert.equal(state.observation?.resets.at(-1)?.reason, "unhealthy");

  state = observe(state, 0.4, 700, 1_000);
  assert.equal(state.observation?.resets.at(-1)?.reason, "stale");
  state = observe(state, 0.4, 1_100, 1_110);
  state = observe(state, 0.4, 1_701, 1_710);
  assert.equal(state.observation?.resets.at(-1)?.reason, "gap");
  state = observe(state, 0.4, 1_700, 1_710);
  assert.equal(state.observation?.resets.at(-1)?.reason, "clock");
  state = resetObservation(state, "restart", 2_000);
  assert.equal(state.observation?.resets.at(-1)?.reason, "restart");

  state = observe(state, 0.3, 2_100, 2_110);
  state = observe(state, 0.3, 2_600, 2_610);
  state = observe(state, 0.3, 3_100, 3_110);
  assert.equal(state.status, "READY");
});

test("ordinary clock skew holds the window; a wrong clock resets it", () => {
  let state = approve(createWorkflow(contract, trusted), "U-OWNER", 3, 100);

  // The target stamps each sample from its own clock, which runs slightly ahead
  // of the coordinator's. That must not be read as an untrustworthy clock.
  state = observe(state, 0.4, 300, 200);
  assert.equal(state.status, "OBSERVING");
  assert.deepEqual(state.observation?.resets, []);

  state = observe(state, 0.4, 700 + MAX_CLOCK_SKEW_MS + 1, 700);
  assert.equal(state.status, "ACTIVE_HOLD");
  assert.equal(state.observation?.resets.at(-1)?.reason, "clock");
});

test("claim is single-use, revalidates trust, and verifies the exact target", () => {
  let state = approve(createWorkflow(contract, trusted), "U-OWNER", 3, 100);
  state = observe(state, 0.3, 1_000, 1_010);
  state = observe(state, 0.3, 1_500, 1_510);
  state = observe(state, 0.3, 2_000, 2_010);

  code(
    () => claim(state, { ...trusted, candidateRevision: "v43" }, "op-1", 2_020),
    "UNTRUSTED_RESOURCE",
  );
  const dispatching = claim(state, trusted, "op-1", 2_020);
  code(() => claim(dispatching, trusted, "op-2", 2_030), "NOT_READY");

  const failed = verify(
    dispatching,
    { revision: "v41", trafficPercent: 100, healthValue: 0.2, observedAt: 2_025 },
    2_030,
  );
  assert.equal(failed.status, "NEEDS_INTERVENTION");
  assert.equal(failed.verification?.observedRevision, "v41");
  assert.equal(verify(
    failed,
    { revision: "v42", trafficPercent: 100, healthValue: 0.2, observedAt: 2_035 },
    2_040,
  ).status, "RETIRED");
  // A read-back from a clock that is wrong beyond the calibration allowance is
  // refused, while ordinary NTP skew between two correct clocks is accepted.
  assert.equal(verify(
    dispatching,
    {
      revision: "v42",
      trafficPercent: 100,
      healthValue: 0.2,
      observedAt: 2_041 + MAX_CLOCK_SKEW_MS,
    },
    2_040,
  ).status, "NEEDS_INTERVENTION");
  assert.equal(verify(
    dispatching,
    { revision: "v42", trafficPercent: 100, healthValue: 0.2, observedAt: 2_140 },
    2_040,
  ).status, "RETIRED");

  const retired = verify(
    dispatching,
    { revision: "v42", trafficPercent: 100, healthValue: 0.2, observedAt: 2_025 },
    2_030,
  );
  assert.equal(retired.status, "RETIRED");
  assert.equal(retired.receipt?.operationId, "op-1");
  assert.equal(promotionAllowed(retired), true);
});

test("uncertain dispatch retains its claim until exact read-back succeeds", () => {
  let state = approve(createWorkflow(contract, trusted), "U-OWNER", 3, 100);
  state = observe(state, 0.3, 1_000, 1_010);
  state = observe(state, 0.3, 1_500, 1_510);
  state = observe(state, 0.3, 2_000, 2_010);
  state = claim(state, trusted, "op-1", 2_020);
  state = markDispatchUncertain(state);
  assert.equal(state.status, "NEEDS_INTERVENTION");
  state = verify(
    state,
    { revision: "v41", trafficPercent: 100, healthValue: 0.2, observedAt: 2_025 },
    2_030,
  );
  assert.equal(state.status, "NEEDS_INTERVENTION");
  assert.equal(state.operation?.id, "op-1");
});

test("untrusted target and missing source abstain before persistence", () => {
  code(
    () => createWorkflow({ ...contract, targetUrl: "https://evil.example" }, trusted),
    "UNTRUSTED_RESOURCE",
  );
  code(
    () => createWorkflow({ ...contract, sourceMessageRef: "" }, trusted),
    "MISSING_SOURCE",
  );
});
