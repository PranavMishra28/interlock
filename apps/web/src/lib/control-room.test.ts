import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyState,
  fixtureStates,
  healthChartDomain,
  healthChartX,
  healthChartY,
  lifecycleNext,
  lifecycleReached,
  loadSnapshot,
  syntheticSnapshot,
} from "./control-room";

test("synthetic Control Room state is explicit and fail-closed", () => {
  const snapshot = syntheticSnapshot();
  assert.equal(snapshot.source, "synthetic");
  assert.equal(snapshot.listener.connected, false);
  assert.equal(snapshot.workflow?.contract.candidateRevision, "v42");
  assert.equal(snapshot.workflow?.status, "OBSERVING");
  assert.equal(snapshot.workflow?.receipt, undefined);
  assert.equal(snapshot.samples.some(({ value }) => value > 1), true);
  assert.equal(snapshot.workflow?.observation?.resets.at(-1)?.reason, "unhealthy");
});

test("health chart places the real threshold and clamps out-of-range values", () => {
  const domain = healthChartDomain(5, [{ value: 0.5 }, { value: 99 }]);
  assert.equal(domain, 99);
  assert.equal(healthChartY(0, domain), 136);
  assert.equal(healthChartY(5, domain), 136 - 5 / 99 * 112);
  assert.equal(healthChartY(-1, domain), 136);
  assert.equal(healthChartY(100, domain), 24);
});

test("health chart preserves timestamp gaps and the single-point fallback", () => {
  assert.equal(healthChartX(0, 0, 60), 24);
  assert.equal(healthChartX(15, 0, 60), 172);
  assert.equal(healthChartX(60, 0, 60), 616);
  assert.equal(healthChartX(15, 15, 15), 320);
});

test("required Control Room fixtures stay explicit and non-authoritative", () => {
  for (const state of fixtureStates) {
    assert.equal(syntheticSnapshot(state).source, "synthetic");
  }
  assert.equal(syntheticSnapshot("empty").workflow, null);
  assert.equal(syntheticSnapshot("awaiting-owner").workflow?.status, "PROPOSED");
  const coordinatorOffline = syntheticSnapshot("coordinator-offline");
  assert.equal(coordinatorOffline.coordinator.connected, false);
  assert.equal(coordinatorOffline.workflow, null);
  assert.deepEqual(coordinatorOffline.samples, []);
  assert.equal(syntheticSnapshot("stale").workflow?.observation?.resets.at(-1)?.reason, "stale");
  assert.equal(syntheticSnapshot("gap").workflow?.observation?.resets.at(-1)?.reason, "gap");
  assert.match(syntheticSnapshot("unauthorized").notice ?? "", /rejected/);
  assert.equal(syntheticSnapshot("intervention").workflow?.status, "NEEDS_INTERVENTION");
  assert.equal(
    syntheticSnapshot("intervention").workflow?.verification?.observedRevision,
    "v41",
  );
  assert.equal(syntheticSnapshot("retired").workflow?.receipt?.observedRevision, "v42");
});

test("READY lifecycle advances to the Claim step", () => {
  assert.equal(lifecycleReached.READY, 5);
  assert.equal(lifecycleNext.READY, "Claim exact promotion");
});

test("configured coordinator failure never retains synthetic live evidence", async () => {
  const priorUrl = process.env.INTERLOCK_COORDINATOR_URL;
  const priorFetch = globalThis.fetch;
  process.env.INTERLOCK_COORDINATOR_URL = "http://127.0.0.1:4317";
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  try {
    const snapshot = await loadSnapshot();
    assert.equal(snapshot.source, "coordinator-error");
    assert.equal(snapshot.coordinator.connected, false);
    assert.equal(snapshot.workflow, null);
    assert.deepEqual(snapshot.samples, []);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorUrl == null) delete process.env.INTERLOCK_COORDINATOR_URL;
    else process.env.INTERLOCK_COORDINATOR_URL = priorUrl;
  }
});

test("invalid coordinator JSON fails closed while unknown source stays coordinator data", async () => {
  const priorUrl = process.env.INTERLOCK_COORDINATOR_URL;
  const priorFetch = globalThis.fetch;
  process.env.INTERLOCK_COORDINATOR_URL = "http://127.0.0.1:4317";
  try {
    const valid = syntheticSnapshot();
    globalThis.fetch = (async () => new Response(JSON.stringify({
      ...valid,
      source: "unknown",
    }))) as typeof fetch;
    assert.equal((await loadSnapshot()).source, "coordinator");

    globalThis.fetch = (async () => new Response(JSON.stringify({
      ...valid,
      workflow: { status: "READY" },
    }))) as typeof fetch;
    const invalid = await loadSnapshot();
    assert.equal(invalid.source, "coordinator-error");
    assert.equal(invalid.workflow, null);
    assert.deepEqual(invalid.samples, []);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorUrl == null) delete process.env.INTERLOCK_COORDINATOR_URL;
    else process.env.INTERLOCK_COORDINATOR_URL = priorUrl;
  }
});

test("an unreachable coordinator is never reported as an absence of decisions", () => {
  const offline = emptyState({ connected: false, reason: "Connection refused" });
  assert.match(offline.title, /unavailable/i);
  assert.match(offline.body, /not evidence that none exists/);
  assert.match(offline.body, /Connection refused/);
  assert.doesNotMatch(offline.body, /has no unresolved workflow/);

  const online = emptyState({ connected: true });
  assert.match(online.body, /has no unresolved workflow/);
});

test("a coordinator that cannot be reached yields a disconnected empty snapshot", async () => {
  const previous = process.env.INTERLOCK_COORDINATOR_URL;
  // Port 1 is reserved and never listening.
  process.env.INTERLOCK_COORDINATOR_URL = "http://127.0.0.1:1";
  try {
    const snapshot = await loadSnapshot();
    assert.equal(snapshot.coordinator.connected, false);
    assert.equal(snapshot.workflow, null);
    assert.ok(snapshot.coordinator.reason);
  } finally {
    if (previous === undefined) delete process.env.INTERLOCK_COORDINATOR_URL;
    else process.env.INTERLOCK_COORDINATOR_URL = previous;
  }
});
